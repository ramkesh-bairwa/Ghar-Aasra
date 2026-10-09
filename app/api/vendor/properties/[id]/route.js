import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";
import { validateListing, saveGalleryAndFeatures, getOwnedListing, VENDOR_STATUSES, SELLER_FIELDS } from "@/lib/vendorListings";
import { getFloorPlanRows, saveFloorPlans } from "@/lib/propertyFloorPlans";
import { addAutoCharge, checkApprovedSeller } from "@/lib/sellers";

// Marking a listing sold/rented adds the seller's per-deal commission.
const DEAL_STATUSES = ["sold", "rented"];
const chargeDeal = (id) => addAutoCharge({ type: "deal", sourceType: "property", sourceId: id, propertyId: id });

// A vendor's own listing: GET (for the edit form), PATCH (full edit or just
// { status }), DELETE. Every call is scoped to owner_user_id = session user.

export async function GET(request, { params }) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const property = await getOwnedListing(params.id, user.id);
  if (!property) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const [images, features, floorPlans] = await Promise.all([
    query("SELECT image_url FROM property_images WHERE property_id = ? ORDER BY sort_order ASC", [property.id]),
    query("SELECT feature FROM property_features WHERE property_id = ?", [property.id]),
    getFloorPlanRows(property.id).catch(() => []),
  ]);
  const fields = Object.fromEntries(SELLER_FIELDS.map((c) => [c, property[c] ?? ""]));
  for (const c of ["possession_date", "available_from", "last_renovated_date"]) {
    if (fields[c]) fields[c] = String(fields[c]).slice(0, 10);
  }
  return NextResponse.json({
    property: {
      ...fields,
      id: property.id,
      slug: property.slug,
      status: property.status,
      gallery: images.map((r) => r.image_url),
      features: features.map((r) => r.feature),
      floorPlans,
    },
  });
}

export async function PATCH(request, { params }) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const property = await getOwnedListing(params.id, user.id);
  if (!property) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const body = await request.json();

  // Status-only change from the dashboard (mark sold, pause, etc.).
  if (Object.keys(body).length === 1 && "status" in body) {
    if (!VENDOR_STATUSES.includes(body.status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    await query("UPDATE properties SET status = ? WHERE id = ?", [body.status, property.id]);
    if (DEAL_STATUSES.includes(body.status)) await chargeDeal(property.id);
    return NextResponse.json({ ok: true });
  }

  const seller = await checkApprovedSeller(user.id);
  if (!seller.account) return NextResponse.json({ error: seller.message, sellerStatus: seller.status }, { status: 403 });

  // "Save changes" sends no status: validate a draft as a draft, anything else as live.
  const listing = await validateListing({ ...body, status: body.status || (property.status === "draft" ? "draft" : "published") });
  if (listing.error) return NextResponse.json({ error: listing.error, fieldErrors: listing.fieldErrors }, { status: 400 });
  try {
    // Keep e.g. "sold" / "under offer" when the seller just edits details.
    const status = VENDOR_STATUSES.includes(body.status) ? body.status : VENDOR_STATUSES.includes(property.status) ? property.status : listing.status;
    const row = { ...listing.row, status };
    const cols = Object.keys(row);
    await query(
      `UPDATE properties SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`,
      [...cols.map((c) => row[c]), property.id]
    );
    await saveGalleryAndFeatures(property.id, listing.gallery, listing.features);
    if (Array.isArray(body.floorPlans)) await saveFloorPlans(property.id, body.floorPlans);
    if (DEAL_STATUSES.includes(status) && !DEAL_STATUSES.includes(property.status)) await chargeDeal(property.id);
    return NextResponse.json({ ok: true, slug: property.slug, id: property.id, status });
  } catch (err) {
    return NextResponse.json({ error: "Could not save your changes.", detail: err.message }, { status: 503 });
  }
}

export async function DELETE(request, { params }) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const property = await getOwnedListing(params.id, user.id);
  if (!property) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  await query("DELETE FROM properties WHERE id = ?", [property.id]);
  return NextResponse.json({ ok: true });
}
