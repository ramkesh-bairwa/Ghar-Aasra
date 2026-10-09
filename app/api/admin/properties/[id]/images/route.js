import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForResource } from "@/lib/adminGuard";

export async function GET(request, { params }) {
  const admin = requireAdminForResource("properties");
  if (!admin) return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });
  try {
    const rows = await query(
      "SELECT image_url FROM property_images WHERE property_id = ? ORDER BY sort_order ASC, id ASC",
      [params.id]
    );
    return NextResponse.json({ images: rows.map((r) => r.image_url) });
  } catch (err) {
    return NextResponse.json({ images: [], error: err.message }, { status: 200 });
  }
}

// Replaces the full gallery for this property with the given ordered array of URLs.
export async function PUT(request, { params }) {
  const admin = requireAdminForResource("properties");
  if (!admin) return NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

  const { images } = await request.json();
  if (!Array.isArray(images)) return NextResponse.json({ error: "images must be an array." }, { status: 400 });

  const clean = images.map((u) => (u || "").trim()).filter(Boolean);

  try {
    await query("DELETE FROM property_images WHERE property_id = ?", [params.id]);
    if (clean.length) {
      const placeholders = clean.map(() => "(?, ?, ?)").join(", ");
      const values = clean.flatMap((url, i) => [params.id, url, i]);
      await query(`INSERT INTO property_images (property_id, image_url, sort_order) VALUES ${placeholders}`, values);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Save failed.", detail: err.message }, { status: 400 });
  }
}
