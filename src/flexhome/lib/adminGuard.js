import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE } from "./auth";

export function requireAdmin() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
