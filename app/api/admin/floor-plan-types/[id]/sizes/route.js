import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { guard, cleanSize, dbError } from "@/lib/floorPlanMaster";

export async function POST(request, { params }) {
  const denied = guard({ write: true });
  if (denied) return denied;
  const { row, error } = cleanSize(await request.json());
  if (error) return NextResponse.json({ error }, { status: 400 });
  try {
    const result = await query(
      "INSERT INTO floor_plan_sizes (floor_plan_type_id, label, carpet_area_sqm, built_up_area_sqm, super_area_sqm) VALUES (?, ?, ?, ?, ?)",
      [Number(params.id), row.label, row.carpet_area_sqm, row.built_up_area_sqm, row.super_area_sqm]
    );
    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (err) {
    return dbError(err, "Could not add the size.");
  }
}
