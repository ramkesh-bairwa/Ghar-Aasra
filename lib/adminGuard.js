import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE } from "./auth";
import { canAccessResource, canAccessSection } from "./adminPermissions";

export function requireAdmin() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// Like requireAdmin(), but also enforces the signed-in admin's role has
// access to the given section/resource. Returns null on either failure —
// callers can't tell "not logged in" from "logged in but not permitted"
// from the return value alone, which is intentional (routes just 401/403
// the same generic way either way; see requireAdminSection below for the
// version that reports which).
export function requireAdminForResource(resourceKey) {
  const admin = requireAdmin();
  if (!admin) return null;
  return canAccessResource(admin.admin_role, resourceKey) ? admin : null;
}

export function requireAdminForSection(section) {
  const admin = requireAdmin();
  if (!admin) return null;
  return canAccessSection(admin.admin_role, section) ? admin : null;
}
