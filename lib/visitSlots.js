// Shared visit-scheduling helpers — the booking form, the property page's
// "next available" chips, and the booking popup all build their day/slot
// grids from here so they always agree with the admin's Visit booking
// settings. No server-only imports, safe for client components.

export function pad(n) {
  return String(n).padStart(2, "0");
}

export function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toMinutes(hhmm, fallback) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : fallback;
}

// Reads the visit_* site settings into plain numbers, with safe fallbacks.
export function slotConfig(settings = {}) {
  const start = toMinutes(settings.visit_day_start, 9 * 60);
  let end = toMinutes(settings.visit_day_end, 18 * 60);
  if (end <= start) end = start + 60;
  const step = Number(settings.visit_slot_minutes) || 30;
  const daysAhead = Number(settings.visit_days_ahead) || 21;
  return { start, end, step, daysAhead };
}

export function buildDays(daysAhead) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export function buildSlots({ start, end, step }) {
  const slots = [];
  for (let m = start; m + step <= end; m += step) {
    slots.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  }
  return slots;
}

export function formatSlotLabel(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${pad(m)} ${period}`;
}

export function isPastSlot(day, hhmm) {
  if (dateKey(day) !== dateKey(new Date())) return false;
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
}

export function dayLabel(day) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (dateKey(day) === dateKey(today)) return "Today";
  if (dateKey(day) === dateKey(tomorrow)) return "Tomorrow";
  return day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export async function fetchTakenSlots(propertyId, key) {
  try {
    const res = await fetch(`/api/bookings/availability?propertyId=${propertyId}&date=${key}`);
    const data = await res.json();
    return data.taken || [];
  } catch {
    return [];
  }
}

// The first `count` bookable slots for a property, scanning forward day by
// day (at most a week) and skipping past + already-taken times.
export async function findNextSlots(propertyId, settings, count = 3) {
  const config = slotConfig(settings);
  const slots = buildSlots(config);
  const found = [];
  for (const day of buildDays(Math.min(config.daysAhead, 7))) {
    const taken = propertyId ? await fetchTakenSlots(propertyId, dateKey(day)) : [];
    for (const time of slots) {
      if (isPastSlot(day, time) || taken.includes(time)) continue;
      found.push({ day, date: dateKey(day), time });
      if (found.length >= count) return found;
    }
  }
  return found;
}

// "YYYY-MM-DD" + "HH:MM" -> calendar-friendly local timestamp "YYYYMMDDTHHMMSS".
function calStamp(date, time, addMinutes = 0) {
  const d = new Date(`${date}T${time}:00`);
  d.setMinutes(d.getMinutes() + addMinutes);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

export function googleCalendarUrl({ title, date, time, minutes = 60, location, details }) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${calStamp(date, time)}/${calStamp(date, time, minutes)}`,
    location: location || "",
    details: details || "",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function downloadIcs({ title, date, time, minutes = 60, location, details }) {
  const esc = (s) => String(s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FlexHome//Visit//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@flexhome`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART:${calStamp(date, time)}`,
    `DTEND:${calStamp(date, time, minutes)}`,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(location)}`,
    `DESCRIPTION:${esc(details)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "property-visit.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function whatsappUrl(number, text) {
  const digits = String(number || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function directionsUrl(property) {
  if (property?.latitude != null && property?.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`;
  }
  const q = property?.address || property?.city;
  return q ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}` : null;
}
