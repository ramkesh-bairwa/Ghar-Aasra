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
      "SELECT id, name, email, password_hash, role FROM users WHERE email = ? AND role = 'admin' LIMIT 1",
      [email]
    );
    if (rows && rows.length) {
      const user = rows[0];
      const ok = await checkPassword(password, user.password_hash);
      if (ok) {
        const token = signAdminToken({ id: user.id, email: user.email, name: user.name });
        const res = NextResponse.json({ ok: true, name: user.name });
        res.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
        return res;
      }
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
  } catch {
    // DB not configured — fall through to demo credentials below.
  }

  if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
    const token = signAdminToken({ id: 0, email, name: "Demo Admin" });
    const res = NextResponse.json({ ok: true, name: "Demo Admin", demo: true });
    res.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  }

  return NextResponse.json({ error: "No matching admin account found." }, { status: 401 });
}
