// Last known /api/admin/me response for this browser tab. Every admin page
// mounts its own AdminGate, so without this each sidebar click would blank
// the screen while the session is re-checked. Display-only: every admin API
// still checks the session cookie itself.
let cachedMe = null;

export function getCachedAdmin() {
  return cachedMe;
}

export function setCachedAdmin(me) {
  cachedMe = me;
}

export function clearAdminSessionCache() {
  cachedMe = null;
}
