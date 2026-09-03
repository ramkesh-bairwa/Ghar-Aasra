import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkPassword, hashPassword, createSessionResponse } from "@/lib/auth";
import { getSiteSetting } from "@/lib/queries";
import { generateToken, putEmailToken } from "@/lib/verificationStore";

// Email/password sign-in and sign-up. Phone auth (always OTP, never a
// password) lives in /api/auth/otp instead.
export async function POST(request) {
  const { action, name, identifier, password } = await request.json();
  if (!identifier || !password) return NextResponse.json({ error: "Email or phone and password are required." }, { status: 400 });
  const isEmail = identifier.includes("@");

  try {
    if (action === "register") {
      if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
      const existing = await query(`SELECT id FROM users WHERE ${isEmail ? "email" : "phone"} = ? LIMIT 1`, [identifier]);
      if (existing.length) return NextResponse.json({ error: "An account with that contact already exists." }, { status: 409 });

      const result = await query(
        "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'buyer')",
        [name, isEmail ? identifier : null, isEmail ? null : identifier, await hashPassword(password)]
      );

      const requireVerification = (await getSiteSetting("require_account_verification")) === "true";
      if (isEmail && requireVerification) {
        const token = generateToken();
        putEmailToken(token, { userId: result.insertId, name, identifier });
        const link = new URL(`/api/auth/verify-email?token=${token}`, request.url).toString();
        // No email provider is configured, so the "sent" link is handed
        // straight back for the admin's verification toggle to be
        // testable — see lib/verificationStore.js.
        return NextResponse.json({ verificationRequired: true, devLink: link });
      }

      return createSessionResponse({ id: result.insertId, name, identifier });
    }

    const rows = await query(`SELECT id, name, email, phone, password_hash FROM users WHERE ${isEmail ? "email" : "phone"} = ? AND role = 'buyer' LIMIT 1`, [identifier]);
    if (!rows.length || !(await checkPassword(password, rows[0].password_hash))) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    return createSessionResponse({ id: rows[0].id, name: rows[0].name, identifier });
  } catch {
    return NextResponse.json({ error: "Authentication service is unavailable." }, { status: 503 });
  }
}
