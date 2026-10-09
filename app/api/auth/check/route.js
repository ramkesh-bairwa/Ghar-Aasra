import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;

// Live validation as the user types their email/phone: format first, then
// (once it looks valid) whether an account already exists — "taken" for
// register, "not_found" for login — so the form can show real-time
// feedback instead of waiting for a full submit + error round trip.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("identifier") || "").trim();
  const mode = searchParams.get("mode") === "register" ? "register" : "login";
  if (!raw) return NextResponse.json({ valid: false });

  const isEmail = raw.includes("@");
  const identifier = isEmail ? raw : raw.replace(/[\s-]/g, "");
  const formatOk = isEmail ? EMAIL_RE.test(identifier) : PHONE_RE.test(identifier);
  if (!formatOk) return NextResponse.json({ valid: false, reason: "format" });

  try {
    const rows = await query(`SELECT id FROM users WHERE ${isEmail ? "email" : "phone"} = ? LIMIT 1`, [identifier]);
    const exists = rows.length > 0;
    if (mode === "register" && exists) return NextResponse.json({ valid: false, reason: "taken" });
    if (mode === "login" && !exists) return NextResponse.json({ valid: false, reason: "not_found" });
    return NextResponse.json({ valid: true });
  } catch {
    // DB unreachable — don't block the form over it, just skip the existence check.
    return NextResponse.json({ valid: true, reason: "unchecked" });
  }
}
