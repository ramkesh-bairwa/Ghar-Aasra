import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { addAutoCharge } from "@/lib/sellers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s-]{6,19}$/;
const SOURCES = ["enquiry", "callback"];

// Enquiry form + "Call me back" widget. A callback only needs a name and a
// phone number; a regular enquiry still needs an email.
export async function POST(request) {
  const body = await request.json();
  const { name, email, phone, message, propertyId, projectId, agentId } = body;
  const source = SOURCES.includes(body.source) ? body.source : "enquiry";

  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (source === "callback") {
    if (!PHONE_RE.test(phone?.trim() || "")) {
      return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    }
  } else if (!EMAIL_RE.test(email || "")) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  try {
    const result = await query(
      `INSERT INTO inquiries (property_id, project_id, agent_id, name, email, phone, message, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [propertyId || null, projectId || null, agentId || null, name.trim(), email || null, phone || null, message || null, source]
    );
    // A buyer lead on a seller's listing adds their per-lead commission.
    if (propertyId) await addAutoCharge({ type: "lead", sourceType: "inquiry", sourceId: result.insertId, propertyId: Number(propertyId) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // DB not configured yet — don't break the UX, just acknowledge receipt.
    return NextResponse.json({ ok: true, stored: false });
  }
}
