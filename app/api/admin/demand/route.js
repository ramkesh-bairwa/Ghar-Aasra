import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminForSection } from "@/lib/adminGuard";
import { getAllSiteSettings } from "@/lib/queries";
import { parseFilters, describeFilters, countMatches } from "@/lib/alerts";

export const dynamic = "force-dynamic";
const forbidden = () => NextResponse.json({ error: "Not authenticated or not permitted." }, { status: 403 });

const BUDGET_BANDS = [
  { label: "Under 25L", max: 2500000 },
  { label: "25L – 50L", max: 5000000 },
  { label: "50L – 1Cr", max: 10000000 },
  { label: "1Cr – 2Cr", max: 20000000 },
  { label: "2Cr+", max: Infinity },
];

// What buyers are looking for (from saved searches and price watches), and
// where demand outruns the listings you have.
export async function GET() {
  if (!requireAdminForSection("demand")) return forbidden();
  try {
    const { currency_symbol } = await getAllSiteSettings();
    const [searches, [totals], watched] = await Promise.all([
      query(
        `SELECT s.id, s.name, s.filters, s.alert_enabled, s.created_at, u.name AS user_name, u.email, u.phone
         FROM saved_searches s JOIN users u ON u.id = s.user_id ORDER BY s.created_at DESC`
      ),
      query(
        `SELECT (SELECT COUNT(*) FROM saved_searches) AS searches,
           (SELECT COUNT(*) FROM saved_searches WHERE alert_enabled = 1) AS active_alerts,
           (SELECT COUNT(DISTINCT user_id) FROM saved_searches) AS users,
           (SELECT COUNT(*) FROM price_watches) AS watches,
           (SELECT COUNT(*) FROM user_alerts WHERE created_at >= NOW() - INTERVAL 30 DAY) AS alerts_30d`
      ),
      query(
        `SELECT p.id, p.title, p.slug, p.price, COUNT(*) AS watchers
         FROM price_watches w JOIN properties p ON p.id = w.property_id
         GROUP BY p.id, p.title, p.slug, p.price ORDER BY watchers DESC LIMIT 10`
      ),
    ]);

    const tally = (key) => {
      const map = {};
      for (const s of searches) {
        const v = key(parseFilters(s.filters));
        if (v) map[v] = (map[v] || 0) + 1;
      }
      return Object.entries(map).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    };

    // Group identical searches, then compare demand with live matches.
    const combos = {};
    for (const s of searches) {
      const f = parseFilters(s.filters);
      const key = JSON.stringify(Object.keys(f).sort().reduce((o, k) => ({ ...o, [k]: f[k] }), {}));
      combos[key] ||= { filters: f, buyers: 0 };
      combos[key].buyers += 1;
    }
    const gaps = await Promise.all(
      Object.values(combos)
        .sort((a, b) => b.buyers - a.buyers)
        .slice(0, 15)
        .map(async (c) => ({ summary: describeFilters(c.filters, currency_symbol), buyers: c.buyers, listings: await countMatches(c.filters), filters: c.filters }))
    );

    return NextResponse.json({
      totals: Object.fromEntries(Object.entries(totals || {}).map(([k, v]) => [k, Number(v || 0)])),
      byCity: tally((f) => f.city || f.locality),
      byType: tally((f) => (f.listingType ? { sale: "Buy", rent: "Rent", commercial: "Commercial" }[f.listingType] : null)),
      byPropertyType: tally((f) => f.propertyType),
      byBedrooms: tally((f) => (f.minBedrooms ? `${f.minBedrooms}+ BHK` : null)),
      byBudget: tally((f) => {
        if (f.maxPrice == null || f.listingType === "rent") return null;
        return BUDGET_BANDS.find((b) => f.maxPrice <= b.max)?.label;
      }),
      gaps,
      watched: watched.map((w) => ({ ...w, watchers: Number(w.watchers) })),
      recent: searches.slice(0, 25).map((s) => ({
        id: s.id, name: s.name, user: s.user_name, contact: s.email || s.phone, alert: !!s.alert_enabled, created_at: s.created_at,
        summary: describeFilters(parseFilters(s.filters), currency_symbol),
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: "Could not load demand data.", detail: err.message }, { status: 503 });
  }
}
