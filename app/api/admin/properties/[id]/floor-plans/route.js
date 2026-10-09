import { NextResponse } from "next/server";
import { requireAdminForResource } from "@/lib/adminGuard";
import { getFloorPlanRows, saveFloorPlans } from "@/lib/propertyFloorPlans";

export async function GET(request, { params }) {
  const admin = requireAdminForResource("properties");
  if (!admin) return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });
  try {
    return NextResponse.json({ floorPlans: await getFloorPlanRows(params.id) });
  } catch (err) {
    return NextResponse.json({ floorPlans: [], error: err.message }, { status: 200 });
  }
}

// Replaces every floor plan for this property with the given ordered array.
export async function PUT(request, { params }) {
  const admin = requireAdminForResource("properties");
  if (!admin) return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

  const { floorPlans } = await request.json();
  if (!Array.isArray(floorPlans)) return NextResponse.json({ error: "floorPlans must be an array." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, count: await saveFloorPlans(params.id, floorPlans) });
  } catch (err) {
    return NextResponse.json({ error: "Save failed.", detail: err.message }, { status: 400 });
  }
}
