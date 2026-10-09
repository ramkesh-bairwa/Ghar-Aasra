import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";

export const dynamic = "force-dynamic";

// Listing-strength scoring. Each check contributes `weight` points (sum = 100)
// and, when it fails, a tip the seller can act on. Tips are ordered by weight
// so the first one is always the most valuable fix.
const CHECKS = [
  { key: "photos", weight: 25, pass: (p) => p.photoCount >= 5, partial: (p) => Math.min(p.photoCount, 5) / 5, tip: "Add at least 5 photos" },
  { key: "description", weight: 20, pass: (p) => p.descriptionLength >= 150, partial: (p) => Math.min(p.descriptionLength, 150) / 150, tip: "Write a longer description (150+ chars)" },
  { key: "amenities", weight: 15, pass: (p) => p.amenityCount >= 5, partial: (p) => Math.min(p.amenityCount, 5) / 5, tip: "Add 5+ amenities" },
  { key: "video", weight: 15, pass: (p) => p.hasVideo, tip: "Add a video tour" },
  { key: "location", weight: 10, pass: (p) => p.hasCoordinates, tip: "Pin the exact location on the map" },
  { key: "floorPlan", weight: 5, pass: (p) => p.hasFloorPlan, tip: "Upload a floor plan" },
  { key: "tour", weight: 5, pass: (p) => p.hasVirtualTour, tip: "Add a 360° virtual tour" },
  { key: "brochure", weight: 5, pass: (p) => p.hasBrochure, tip: "Attach a brochure (PDF)" },
];

function scoreListing(p) {
  let score = 0;
  const tips = [];
  for (const c of CHECKS) {
    if (c.pass(p)) score += c.weight;
    else {
      if (c.partial) score += Math.round(c.weight * c.partial(p));
      tips.push(c.tip);
    }
  }
  return { strength: Math.min(100, Math.round(score)), tips };
}

// Timestamps go out as ISO-8601 UTC (via UNIX_TIMESTAMP, which honours the
// MySQL session time zone) so the browser can bucket/format them in local time.
const toIso = (ts) => (ts == null ? null : new Date(Number(ts) * 1000).toISOString());

const filled = (v) => v != null && String(v).trim() !== "";

// Everything the vendor dashboard needs in one call: the user's own
// listings with per-listing engagement + quality signals, and every lead
// (enquiry, callback, visit booking, visit request) on those listings.
// Visits only appear once an admin has approved them (approved_at set).
export async function GET() {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  try {
    const properties = await query(
      `SELECT p.id, p.slug, p.title, p.listing_type, p.property_type, p.price, p.price_period, p.status,
         p.cover_image_url, COALESCE(p.views_count, 0) AS views, p.bedrooms, p.bathrooms, p.area_sqm,
         p.carpet_area_sqm, p.built_up_area_sqm, p.video_url, p.virtual_tour_url, p.floor_plan_url,
         p.brochure_url, CHAR_LENGTH(COALESCE(p.description, '')) AS description_length,
         p.latitude, p.longitude, p.created_at, UNIX_TIMESTAMP(p.created_at) AS created_ts,
         UNIX_TIMESTAMP(p.updated_at) AS updated_ts, l.city, sc.name AS subcategory_name,
         (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) AS image_count,
         (SELECT COUNT(*) FROM property_features pf WHERE pf.property_id = p.id) AS amenity_count,
         (SELECT COUNT(*) FROM inquiries i WHERE i.property_id = p.id) AS enquiries,
         (SELECT COUNT(*) FROM bookings b WHERE b.property_id = p.id AND b.approved_at IS NOT NULL AND b.status != 'cancelled')
           + (SELECT COUNT(*) FROM visit_requests v WHERE v.property_id = p.id AND v.approved_at IS NOT NULL) AS visits,
         (SELECT COUNT(*) FROM favorites f WHERE f.property_id = p.id) AS saves
       FROM properties p
       LEFT JOIN locations l ON l.id = p.location_id
       LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
       WHERE p.owner_user_id = ?
       ORDER BY p.created_at DESC`,
      [user.id]
    );

    const leads = await query(
      `SELECT * FROM (
         SELECT CONCAT('i', i.id) AS id, NULL AS booking_code, IF(i.source = 'callback', 'callback', 'enquiry') AS type,
           i.name, i.email, i.phone, i.message AS note, NULL AS scheduled_at, i.status, i.created_at,
           UNIX_TIMESTAMP(i.created_at) AS created_ts,
           p.id AS property_id, p.title AS property_title, p.slug AS property_slug
         FROM inquiries i JOIN properties p ON p.id = i.property_id
         WHERE p.owner_user_id = ?
         UNION ALL
         SELECT CONCAT('b', b.id), b.booking_code, 'visit', COALESCE(u.name, b.guest_name), COALESCE(u.email, b.guest_email),
           COALESCE(u.phone, b.guest_phone), b.notes, b.scheduled_at, b.status, b.created_at, UNIX_TIMESTAMP(b.created_at), p.id, p.title, p.slug
         FROM bookings b JOIN properties p ON p.id = b.property_id LEFT JOIN users u ON u.id = b.user_id
         WHERE p.owner_user_id = ? AND b.approved_at IS NOT NULL
         UNION ALL
         SELECT CONCAT('v', v.id), v.booking_code, 'visit_request', v.name, v.email, v.phone, v.message,
           CONCAT(v.preferred_date, ' ', COALESCE(v.preferred_time, '')), v.status, v.created_at, UNIX_TIMESTAMP(v.created_at), p.id, p.title, p.slug
         FROM visit_requests v JOIN properties p ON p.id = v.property_id
         WHERE p.owner_user_id = ? AND v.approved_at IS NOT NULL
       ) leads ORDER BY created_at DESC LIMIT 200`,
      [user.id, user.id, user.id]
    );
    const [due] = await query(
      "SELECT COUNT(*) AS n FROM seller_charges WHERE seller_user_id = ? AND status = 'unpaid'",
      [user.id]
    ).catch(() => [{ n: 0 }]);

    return NextResponse.json({
      unpaidCharges: Number(due?.n || 0),
      properties: properties.map((p) => {
        const base = {
          id: p.id, slug: p.slug, title: p.title, listingType: p.listing_type, propertyType: p.property_type,
          price: Number(p.price), pricePeriod: p.price_period, status: p.status, image: p.cover_image_url,
          views: Number(p.views), enquiries: Number(p.enquiries), visits: Number(p.visits), saves: Number(p.saves),
          bedrooms: p.bedrooms, bathrooms: p.bathrooms,
          areaSqm: p.area_sqm != null ? Number(p.area_sqm)
            : p.built_up_area_sqm != null ? Number(p.built_up_area_sqm)
            : p.carpet_area_sqm != null ? Number(p.carpet_area_sqm) : null,
          city: p.city, subcategoryName: p.subcategory_name || null,
          createdAt: toIso(p.created_ts), updatedAt: toIso(p.updated_ts) || toIso(p.created_ts),
          photoCount: Number(p.image_count) + (filled(p.cover_image_url) ? 1 : 0),
          hasVideo: filled(p.video_url),
          hasVirtualTour: filled(p.virtual_tour_url),
          hasFloorPlan: filled(p.floor_plan_url),
          hasBrochure: filled(p.brochure_url),
          descriptionLength: Number(p.description_length) || 0,
          amenityCount: Number(p.amenity_count),
          hasCoordinates: p.latitude != null && p.longitude != null && !(Number(p.latitude) === 0 && Number(p.longitude) === 0),
        };
        return { ...base, ...scoreListing(base) };
      }),
      leads: leads.map((l) => ({
        id: l.id, bookingCode: l.booking_code || null, type: l.type, name: l.name, email: l.email, phone: l.phone, note: l.note,
        scheduledAt: l.scheduled_at ? String(l.scheduled_at).trim() : null, status: l.status, createdAt: toIso(l.created_ts),
        propertyId: l.property_id, propertyTitle: l.property_title, propertySlug: l.property_slug,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: "Could not load your dashboard.", detail: err.message }, { status: 503 });
  }
}
