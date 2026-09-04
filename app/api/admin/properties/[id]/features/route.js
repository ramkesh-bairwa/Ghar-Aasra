import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(request, { params }) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  try {
    const rows = await query("SELECT feature FROM property_features WHERE property_id = ?", [params.id]);
    return NextResponse.json({ features: rows.map((r) => r.feature) });
  } catch (err) {
    return NextResponse.json({ features: [], error: err.message }, { status: 200 });
  }
}

// Replaces the full amenity list for this property with the given array.
export async function PUT(request, { params }) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { features } = await request.json();
  if (!Array.isArray(features)) return NextResponse.json({ error: "features must be an array." }, { status: 400 });

  try {
    await query("DELETE FROM property_features WHERE property_id = ?", [params.id]);
    if (features.length) {
      const placeholders = features.map(() => "(?, ?)").join(", ");
      const values = features.flatMap((f) => [params.id, f]);
      await query(`INSERT INTO property_features (property_id, feature) VALUES ${placeholders}`, values);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Save failed.", detail: err.message }, { status: 400 });
  }
}
