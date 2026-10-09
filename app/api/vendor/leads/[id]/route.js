import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";
import { addAutoCharge } from "@/lib/sellers";

export const dynamic = "force-dynamic";

// Lead ids are prefixed by source table, matching /api/vendor/overview:
// i<id> → inquiries, b<id> → bookings, v<id> → visit_requests.
// Table names and enums are fixed here, never taken from the request.
// Visits are only the seller's once an admin has approved them, so sellers
// can act on approved ones but can't send them back to awaiting review.
const SOURCES = {
  i: { table: "inquiries", statuses: ["new", "contacted", "closed"] },
  b: { table: "bookings", statuses: ["confirmed", "completed", "cancelled", "no_show"], approval: true },
  v: { table: "visit_requests", statuses: ["contacted", "scheduled", "closed"], approval: true },
};

export async function PATCH(request, { params }) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const match = /^([ibv])(\d+)$/.exec(String(params.id || ""));
  if (!match) return NextResponse.json({ error: "Invalid lead id." }, { status: 400 });
  const source = SOURCES[match[1]];
  const id = Number(match[2]);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const status = String(body?.status || "");
  if (!source.statuses.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${source.statuses.join(", ")}.` },
      { status: 400 }
    );
  }

  try {
    const rows = await query(
      `SELECT t.id, t.property_id FROM ${source.table} t JOIN properties p ON p.id = t.property_id
       WHERE t.id = ? AND p.owner_user_id = ?${source.approval ? " AND t.approved_at IS NOT NULL" : ""} LIMIT 1`,
      [id, user.id]
    );
    if (!rows.length) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

    await query(`UPDATE ${source.table} SET status = ? WHERE id = ?`, [status, id]);
    // Same per-visit commission as when an admin marks the visit completed.
    if (match[1] === "b" && status === "completed") {
      await addAutoCharge({ type: "visit", sourceType: "booking", sourceId: id, propertyId: rows[0].property_id });
    }
    return NextResponse.json({ ok: true, id: params.id, status });
  } catch (err) {
    return NextResponse.json({ error: "Could not update this lead.", detail: err.message }, { status: 503 });
  }
}
