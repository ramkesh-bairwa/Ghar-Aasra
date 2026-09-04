// In-memory holding pen for phone OTP codes and email verification tokens.
// There's no SMS/email provider wired up, so these never leave the server —
// the API routes hand the code/link straight back in the response for the
// admin's "require verification" toggle to be testable without one. A
// single long-lived `next start` process is what this app runs as, so a
// module-level Map survives for the process lifetime; it does not survive
// a restart, and would not work across multiple serverless instances.
const globalStore = globalThis;

function getStore(name) {
  if (!globalStore[name]) globalStore[name] = new Map();
  return globalStore[name];
}

const OTP_TTL_MS = 5 * 60 * 1000;
const EMAIL_TOKEN_TTL_MS = 15 * 60 * 1000;

function sweep(map) {
  const now = Date.now();
  for (const [key, entry] of map) {
    if (entry.expiresAt < now) map.delete(key);
  }
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateToken() {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}

export function putOtp(identifier, entry) {
  const store = getStore("__otpStore");
  sweep(store);
  store.set(identifier, { ...entry, expiresAt: Date.now() + OTP_TTL_MS });
}

export function peekOtp(identifier) {
  const store = getStore("__otpStore");
  const entry = store.get(identifier);
  if (!entry || entry.expiresAt < Date.now()) {
    store.delete(identifier);
    return null;
  }
  return entry;
}

export function consumeOtp(identifier) {
  const store = getStore("__otpStore");
  store.delete(identifier);
}

export function putEmailToken(token, entry) {
  const store = getStore("__emailTokenStore");
  sweep(store);
  store.set(token, { ...entry, expiresAt: Date.now() + EMAIL_TOKEN_TTL_MS });
}

export function consumeEmailToken(token) {
  const store = getStore("__emailTokenStore");
  const entry = store.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    store.delete(token);
    return null;
  }
  store.delete(token);
  return entry;
}

export const OTP_TTL_SECONDS = OTP_TTL_MS / 1000;
