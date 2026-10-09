import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { guard, cleanType, dbError } from "@/lib/floorPlanMaster";

export async function PUT(request, { params }) {
  const denied = guard({ write: true });
  if (denied) return denied;
  const { row, error } = cleanType(await request.json());
  if (error) return NextResponse.json({ error }, { status: 400 });
  try {
    await query(
      "UPDATE floor_plan_types SET name = ?, bedrooms = ?, bathrooms = ?, balconies = ?, sort_order = ? WHERE id = ?",
      [row.name, row.bedrooms, row.bathrooms, row.balconies, row.sort_order, Number(params.id)]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbError(err, "Could not save the floor plan.");
  }
}

// Removes the type and its sizes. Properties keep their copied floor plans.
export async function DELETE(request, { params }) {
  const denied = guard({ write: true });
  if (denied) return denied;
  try {
    await query("UPDATE property_floor_plans SET floor_plan_type_id = NULL, floor_plan_size_id = NULL WHERE floor_plan_type_id = ?", [Number(params.id)]);
    await query("DELETE FROM floor_plan_types WHERE id = ?", [Number(params.id)]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbError(err, "Could not delete the floor plan.");
  }
}
