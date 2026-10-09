import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { guard, cleanSize, dbError } from "@/lib/floorPlanMaster";

export async function PUT(request, { params }) {
  const denied = guard({ write: true });
  if (denied) return denied;
  const { row, error } = cleanSize(await request.json());
  if (error) return NextResponse.json({ error }, { status: 400 });
  try {
    await query(
      "UPDATE floor_plan_sizes SET label = ?, carpet_area_sqm = ?, built_up_area_sqm = ?, super_area_sqm = ? WHERE id = ?",
      [row.label, row.carpet_area_sqm, row.built_up_area_sqm, row.super_area_sqm, Number(params.id)]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbError(err, "Could not save the size.");
  }
}

// Properties keep the areas they copied from this size.
export async function DELETE(request, { params }) {
  const denied = guard({ write: true });
  if (denied) return denied;
  try {
    await query("UPDATE property_floor_plans SET floor_plan_size_id = NULL WHERE floor_plan_size_id = ?", [Number(params.id)]);
    await query("DELETE FROM floor_plan_sizes WHERE id = ?", [Number(params.id)]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbError(err, "Could not delete the size.");
  }
}
