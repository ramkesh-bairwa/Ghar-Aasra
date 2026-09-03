import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createSessionResponse, randomPasswordHash } from "@/lib/auth";
import { getSiteSetting } from "@/lib/queries";
import { generateOtp, putOtp, peekOtp, consumeOtp, OTP_TTL_SECONDS } from "@/lib/verificationStore";

const PHONE_RE = /^\+?[0-9]{7,15}$/;

// Phone sign-in/sign-up never uses a password. When the admin's "Require
// verification" toggle is off this logs the user straight in on the phone
// number alone (dev/testing shortcut); when it's on, it hands back a code
// (no SMS provider is configured) that the client shows on screen for 5s
// and the user re-enters to complete the "request" -> "verify" round trip.
export async function POST(request) {
  const { action, mode, identifier, name, code } = await request.json();
  const phone = (identifier || "").replace(/[\s-]/g, "");
  if (!PHONE_RE.test(phone)) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  const isRegister = mode === "register";

  try {
    if (action === "request") {
      const existing = await query("SELECT id, name FROM users WHERE phone = ? AND role = 'buyer' LIMIT 1", [phone]);
      if (isRegister) {
        if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
        if (existing.length) return NextResponse.json({ error: "An account with that phone number already exists." }, { status: 409 });
      } else if (!existing.length) {
        return NextResponse.json({ error: "No account found with that phone number." }, { status: 404 });
      }

      const requireVerification = (await getSiteSetting("require_account_verification")) === "true";
      if (!requireVerification) {
        if (isRegister) {
          const result = await query(
            "INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, 'buyer')",
            [name, phone, await randomPasswordHash()]
          );
          return createSessionResponse({ id: result.insertId, name, identifier: phone });
        }
        return createSessionResponse({ id: existing[0].id, name: existing[0].name, identifier: phone });
      }

      const otp = generateOtp();
      putOtp(phone, { code: otp, mode, name });
      // Testing mode: no SMS provider, so the code rides back in the
      // response instead of going out over SMS.
      return NextResponse.json({ otpRequired: true, devCode: otp, expiresIn: OTP_TTL_SECONDS });
    }

    if (action === "verify") {
      const entry = peekOtp(phone);
      if (!entry) return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 400 });
      if (entry.code !== String(code || "")) return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
      consumeOtp(phone);

      if (entry.mode === "register") {
        const existing = await query("SELECT id FROM users WHERE phone = ? LIMIT 1", [phone]);
        if (existing.length) return NextResponse.json({ error: "An account with that phone number already exists." }, { status: 409 });
        const result = await query(
          "INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, 'buyer')",
          [entry.name, phone, await randomPasswordHash()]
        );
        return createSessionResponse({ id: result.insertId, name: entry.name, identifier: phone });
      }

      const rows = await query("SELECT id, name FROM users WHERE phone = ? AND role = 'buyer' LIMIT 1", [phone]);
      if (!rows.length) return NextResponse.json({ error: "No account found with that phone number." }, { status: 404 });
      return createSessionResponse({ id: rows[0].id, name: rows[0].name, identifier: phone });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Authentication service is unavailable." }, { status: 503 });
  }
}
