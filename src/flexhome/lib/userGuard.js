import { cookies } from "next/headers";
import { verifyUserToken, USER_COOKIE } from "./auth";

export function requireUser() {
  const token = cookies().get(USER_COOKIE)?.value;
  if (!token) return null;
  return verifyUserToken(token);
}
