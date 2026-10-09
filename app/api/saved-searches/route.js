import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/userGuard";
import { getAllSiteSettings } from "@/lib/queries";
import { cleanFilters, parseFilters, countMatches, describeFilters } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  try {
    const { currency_symbol } = await getAllSiteSettings();
    const rows = await query("SELECT id, name, filters, alert_enabled, created_at FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC", [user.id]);
    const searches = await Promise.all(
      rows.map(async (r) => {
        const filters = parseFilters(r.filters);
        return { ...r, filters, summary: describeFilters(filters, currency_symbol), matches: await countMatches(filters) };
      })
    );
    return NextResponse.json({ searches });
  } catch (err) {
    return NextResponse.json({ error: "Could not load your saved searches.", detail: err.message }, { status: 503 });
  }
}

export async function POST(request) {
  const user = requireUser();
  if (!user) return NextResponse.json({ error: "Please sign in to save searches." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const settings = await getAllSiteSettings();
  if (settings.alerts_enabled === "false") return NextResponse.json({ error: "Saved searches are switched off right now." }, { status: 403 });

  const filters = cleanFilters(body.filters || {});
  const name = String(body.name || "").trim().slice(0, 120);
  const e = {};
  if (!name) e.name = "Give this search a name, e.g. \"2 BHK in Jaipur\".";
  if (!Object.keys(filters).length) e.filters = "Pick at least one filter (city, budget, type…) so we know what to alert you about.";
  const limit = Math.max(1, Number(settings.saved_search_limit) || 10);
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM saved_searches WHERE user_id = ?", [user.id]);
  if (Number(n) >= limit) e.name = `You can save up to ${limit} searches. Delete one from My alerts first.`;
  if (Object.keys(e).length) return NextResponse.json({ error: Object.values(e)[0], fieldErrors: e }, { status: 400 });

  const r = await query(
    "INSERT INTO saved_searches (user_id, name, filters, alert_enabled, last_checked_at) VALUES (?, ?, ?, ?, NOW())",
    [user.id, name, JSON.stringify(filters), body.alert_enabled === false ? 0 : 1]
  );
  return NextResponse.json({ ok: true, id: r.insertId, matches: await countMatches(filters) });
}
