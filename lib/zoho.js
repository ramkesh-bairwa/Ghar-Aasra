import { query } from "./db";

// Zoho Calendar sync. Deliberately reads/writes its own zoho_settings table
// (see database/schema.sql) instead of site_settings, since the refresh
// token stored here must never flow through getAllSiteSettings()'s shared,
// cached, broadly-read object.

const REGION = process.env.ZOHO_REGION || "com";
const CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ACCOUNTS_BASE = `https://accounts.zoho.${REGION}`;
const CALENDAR_BASE = `https://calendar.zoho.${REGION}/api/v1`;
// ZohoCalendar.calendar.ALL lets the admin-connect flow list calendars to
// pick a default; ZohoCalendar.event.ALL is what lets bookings create events.
const SCOPE = "ZohoCalendar.calendar.ALL,ZohoCalendar.event.ALL";

async function getSetting(key) {
  const rows = await query("SELECT setting_value FROM zoho_settings WHERE setting_key = ? LIMIT 1", [key]);
  return rows[0]?.setting_value ?? null;
}

async function setSetting(key, value) {
  await query(
    `INSERT INTO zoho_settings (setting_key, setting_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [key, value]
  );
}

async function clearSetting(key) {
  await query("DELETE FROM zoho_settings WHERE setting_key = ?", [key]);
}

export function getZohoAuthUrl(redirectUri) {
  const params = new URLSearchParams({
    scope: SCOPE,
    client_id: CLIENT_ID,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    redirect_uri: redirectUri,
  });
  return `${ACCOUNTS_BASE}/oauth/v2/auth?${params}`;
}

async function requestToken(body) {
  const res = await fetch(`${ACCOUNTS_BASE}/oauth/v2/token`, { method: "POST", body });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Zoho token request failed.");
  return data;
}

export async function exchangeCodeForTokens(code, redirectUri) {
  return requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri,
      code,
    })
  );
}

async function refreshAccessToken(refreshToken) {
  const data = await requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    })
  );
  return data.access_token;
}

// Access tokens last ~1hr; cached in-process (per server instance) alongside
// the DB round trip for the refresh token so a burst of bookings doesn't
// hit Zoho's token endpoint once per booking.
const globalForZoho = globalThis;

async function getValidAccessToken() {
  const refreshToken = await getSetting("refresh_token");
  if (!refreshToken) return null;

  const cached = globalForZoho.__zohoAccessToken;
  if (cached && cached.refreshToken === refreshToken && cached.expiresAt > Date.now() + 30_000) {
    return cached.token;
  }

  const token = await refreshAccessToken(refreshToken);
  globalForZoho.__zohoAccessToken = { token, refreshToken, expiresAt: Date.now() + 55 * 60 * 1000 };
  return token;
}

export async function listZohoCalendars(accessToken) {
  const res = await fetch(`${CALENDAR_BASE}/calendars`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Could not list Zoho calendars.");
  return data.calendars || [];
}

export async function connectZohoCalendar(code, redirectUri, adminId) {
  const tokens = await exchangeCodeForTokens(code, redirectUri);
  const calendars = await listZohoCalendars(tokens.access_token);
  const defaultCalendar = calendars.find((c) => c.isdefault) || calendars[0];
  if (!defaultCalendar) throw new Error("No Zoho Calendar found on that account.");

  await setSetting("refresh_token", tokens.refresh_token);
  await setSetting("calendar_uid", defaultCalendar.uid);
  await setSetting("calendar_name", defaultCalendar.name || "");
  await setSetting("connected_by", String(adminId ?? ""));
  await setSetting("connected_at", new Date().toISOString());
  await clearSetting("last_sync_error");
}

export async function disconnectZohoCalendar() {
  await Promise.all(
    ["refresh_token", "calendar_uid", "calendar_name", "connected_by", "connected_at", "last_sync_error"].map(
      clearSetting
    )
  );
}

export async function getZohoStatus() {
  const [connected, calendarName, connectedAt, lastSyncError] = await Promise.all([
    getSetting("refresh_token"),
    getSetting("calendar_name"),
    getSetting("connected_at"),
    getSetting("last_sync_error"),
  ]);
  return { connected: Boolean(connected), calendarName, connectedAt, lastSyncError };
}

// "YYYY-MM-DD" + "HH:MM" or "HH:MM:SS" -> Zoho's compact "YYYYMMDDTHHMMSS"
// (no offset — timezone is passed as a separate field alongside it).
function toZohoDateTime(dateStr, timeStr) {
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${dateStr.replace(/-/g, "")}T${time.replace(/:/g, "")}`;
}

function addOneHour(dateStr, timeStr) {
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const start = new Date(`${dateStr}T${time}`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
    time: `${pad(end.getHours())}:${pad(end.getMinutes())}:${pad(end.getSeconds())}`,
  };
}

// Best-effort: creates a Zoho Calendar event for a scheduled visit. Never
// throws — a Zoho outage or a not-yet-connected account must not block a
// booking or visit-request from saving. Failures are recorded to
// zoho_settings.last_sync_error for the admin "Zoho Calendar" card to show,
// rather than surfaced to the caller.
export async function createZohoCalendarEvent({ title, description, date, time, timezone = "Asia/Kolkata" }) {
  try {
    const calendarUid = await getSetting("calendar_uid");
    if (!calendarUid) return; // not connected — nothing to do

    const accessToken = await getValidAccessToken();
    if (!accessToken) return;

    const end = addOneHour(date, time);
    const eventdata = JSON.stringify({
      title,
      description: description || "",
      dateandtime: {
        timezone,
        start: toZohoDateTime(date, time),
        end: toZohoDateTime(end.date, end.time),
      },
    });

    const res = await fetch(`${CALENDAR_BASE}/calendars/${calendarUid}/events`, {
      method: "POST",
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ eventdata }),
    });

    if (!res.ok) {
      const detail = await res.text();
      await setSetting("last_sync_error", detail.slice(0, 1000));
    } else {
      await clearSetting("last_sync_error");
    }
  } catch (err) {
    try {
      await setSetting("last_sync_error", String(err.message || err).slice(0, 1000));
    } catch {
      // zoho_settings itself unreachable — nothing more we can do here.
    }
  }
}
