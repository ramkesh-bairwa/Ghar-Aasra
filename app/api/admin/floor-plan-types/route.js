import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { guard, cleanType, listTypes, dbError } from "@/lib/floorPlanMaster";

export async function GET() {
  const denied = guard();
  if (denied) return denied;
  try {
    return NextResponse.json({ types: await listTypes() });
  } catch (err) {
    return NextResponse.json({ types: [], error: "Could not reach MySQL.", detail: err.message }, { status: 503 });
  }
}

export async function POST(request) {
  const denied = guard({ write: true });
  if (denied) return denied;
  const { row, error } = cleanType(await request.json());
  if (error) return NextResponse.json({ error }, { status: 400 });
  try {
    if (!row.sort_order) {
      const [{ next }] = await query("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM floor_plan_types");
      row.sort_order = next;
    }
    const result = await query(
      "INSERT INTO floor_plan_types (name, bedrooms, bathrooms, balconies, sort_order) VALUES (?, ?, ?, ?, ?)",
      [row.name, row.bedrooms, row.bathrooms, row.balconies, row.sort_order]
    );
    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    return dbError(err, "Could not add the floor plan.");
  }
}
