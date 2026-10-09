import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";
import { validateListing, saveGalleryAndFeatures } from "@/lib/vendorListings";
import { saveFloorPlans } from "@/lib/propertyFloorPlans";
import { checkApprovedSeller } from "@/lib/sellers";

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180) || "property";
}

async function uniqueSlug(base) {
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await query("SELECT id FROM properties WHERE slug = ? LIMIT 1", [slug]);
    if (!existing.length) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function POST(request) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  // Only approved sellers can list (self-registered sellers wait for admin approval).
  const seller = await checkApprovedSeller(user.id);
  if (!seller.account) return NextResponse.json({ error: seller.message, sellerStatus: seller.status }, { status: 403 });

  const body = await request.json();
  const listing = await validateListing(body);
  if (listing.error) return NextResponse.json({ error: listing.error, fieldErrors: listing.fieldErrors }, { status: 400 });

  try {
    const slug = await uniqueSlug(slugify(listing.row.title));
    const row = { ...listing.row, slug, status: listing.status, featured: 0, owner_user_id: user.id };
    const cols = Object.keys(row);
    const result = await query(
      `INSERT INTO properties (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
      cols.map((c) => row[c])
    );
    await saveGalleryAndFeatures(result.insertId, listing.gallery, listing.features);
    if (Array.isArray(body.floorPlans)) await saveFloorPlans(result.insertId, body.floorPlans);
    return NextResponse.json({ ok: true, slug, id: result.insertId, status: listing.status });
  } catch (err) {
    return NextResponse.json({ error: "Could not publish your listing.", detail: err.message }, { status: 503 });
  }
}
