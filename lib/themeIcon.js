// Favicon drawn in the site's theme colours (Site Settings → Theme colors):
// a primary-colour tile with the house mark in the secondary colour. Shared
// by the SVG and PNG favicon routes so both always match.

const HEX = /^#[0-9a-f]{6}$/i;
const pick = (v, fallback) => (HEX.test(String(v || "")) ? v : fallback);

// Mix a hex colour toward white (amount > 0) or black (amount < 0).
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount))
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function themeIconColors(settings = {}) {
  const own = settings.favicon_use_theme_colors === "false";
  const primary = own ? pick(settings.favicon_bg_color, "#0f1b2d") : pick(settings.primary_color, "#0f1b2d");
  const secondary = own ? pick(settings.favicon_icon_color, "#14b8ac") : pick(settings.secondary_color, "#14b8ac");
  const background = pick(settings.background_color, "#f8f7f4");
  return { tileTop: shade(primary, 0.12), tileBottom: primary, house: secondary, door: primary, bar: background };
}

// Short fingerprint of everything that changes the favicon, appended to its
// URLs so browsers fetch the new icon as soon as the admin changes it.
export function faviconVersion(settings = {}) {
  const key = [settings.favicon_url, settings.favicon_use_theme_colors, settings.favicon_bg_color, settings.favicon_icon_color,
    settings.primary_color, settings.secondary_color, settings.background_color].join("|");
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// The admin-uploaded favicon, if any (empty or the old built-in default = none).
export function customFavicon(settings = {}) {
  const v = String(settings.favicon_url || "").trim();
  return v && !v.startsWith("/theme-icon") ? v : null;
}

export function themeIconSvg(settings, size = 64) {
  const c = themeIconColors(settings);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.tileTop}"/><stop offset="1" stop-color="${c.tileBottom}"/></linearGradient></defs>
  <rect width="64" height="64" rx="15" fill="url(#t)"/>
  <path d="M32 9.5 L57 31 a2.6 2.6 0 0 1 -1.7 4.6 H51 V52 a4 4 0 0 1 -4 4 H17 a4 4 0 0 1 -4 -4 V35.6 H8.7 A2.6 2.6 0 0 1 7 31 Z" fill="${c.house}"/>
  <path d="M26.5 56 V45 a5.5 5.5 0 0 1 11 0 V56 Z" fill="${c.door}"/>
  <rect x="24" y="28" width="16" height="4.6" rx="2.3" fill="${c.bar}"/>
</svg>`;
}
