import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";

// Proxies OpenStreetMap's free Nominatim geocoder so the admin panel can turn
// an address into latitude/longitude without any API key. Nominatim's usage
// policy requires a real identifying User-Agent and no heavy request volume —
// fine for occasional manual lookups from the admin panel.
export async function GET(request) {
  const admin = requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q");
  if (!q || !q.trim()) return NextResponse.json({ error: "Missing query." }, { status: 400 });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": "FlexHomeAdmin/1.0 (real estate listing admin panel)" } }
    );
    if (!res.ok) return NextResponse.json({ error: "Lookup failed." }, { status: 502 });
    const results = await res.json();
    if (!results.length) return NextResponse.json({ error: "No match found for that address." }, { status: 404 });
    const { lat, lon, display_name } = results[0];
    return NextResponse.json({ latitude: Number(lat), longitude: Number(lon), displayName: display_name });
  } catch (err) {
    return NextResponse.json({ error: "Lookup failed.", detail: err.message }, { status: 502 });
  }
}
