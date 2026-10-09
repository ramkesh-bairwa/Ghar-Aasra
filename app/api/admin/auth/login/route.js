import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkPassword, signAdminToken, ADMIN_COOKIE, DEMO_ADMIN } from "@/lib/auth";

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // Try a real admin user in MySQL first.
  try {
    const rows = await query(
      "SELECT id, name, email, password_hash, role, admin_role, status FROM users WHERE email = ? AND role = 'admin' LIMIT 1",
      [email]
    );
    if (rows && rows.length) {
      const user = rows[0];
      const ok = await checkPassword(password, user.password_hash);
      if (ok && user.status === "suspended") {
        return NextResponse.json({ error: "This account has been suspended. Contact an admin." }, { status: 403 });
      }
      if (ok) {
        const token = signAdminToken({ id: user.id, email: user.email, name: user.name, admin_role: user.admin_role });
        const res = NextResponse.json({ ok: true, name: user.name, adminRole: user.admin_role });
        res.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
        return res;
      }
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
  } catch {
    // DB not configured — fall through to demo credentials below.
  }

  if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
    const token = signAdminToken({ id: 0, email, name: "Demo Admin", admin_role: "super_admin" });
    const res = NextResponse.json({ ok: true, name: "Demo Admin", demo: true });
    res.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  }

  return NextResponse.json({ error: "No matching admin account found." }, { status: 401 });
}
