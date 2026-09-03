import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request) {
  const body = await request.json();
  const { name, email, phone, message, propertyId, projectId, agentId } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  try {
    await query(
      `INSERT INTO inquiries (property_id, project_id, agent_id, name, email, phone, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [propertyId || null, projectId || null, agentId || null, name, email, phone || null, message || null]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    // DB not configured yet — don't break the UX, just acknowledge receipt.
    return NextResponse.json({ ok: true, stored: false });
  }
}
