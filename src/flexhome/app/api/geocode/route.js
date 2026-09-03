import { NextResponse } from "next/server";

// Public proxy for OpenStreetMap's free Nominatim geocoder, used by the
// homepage hero search-as-you-type location field. No API key required —
// Nominatim's usage policy just wants a real identifying User-Agent and
// light request volume, which is why this stays server-side instead of
// being called directly from the browser.
export async function GET(request) {
  const q = new URL(request.url).searchParams.get("q");
  if (!q || !q.trim()) return NextResponse.json({ results: [] });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": "FlexHome/1.0 (real estate search)" } }
    );
    if (!res.ok) return NextResponse.json({ error: "Lookup failed." }, { status: 502 });

    const raw = await res.json();
    const results = raw.map((place) => {
      const addr = place.address || {};
      // Pick the most "city-level" label available so it lines up with how
      // properties are stored (locations.city / properties.address), rather
      // than passing a whole street-level display_name through as a filter.
      const cityLabel =
        addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state || place.name;
      return {
        displayName: place.display_name,
        cityLabel,
        latitude: Number(place.lat),
        longitude: Number(place.lon),
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: "Lookup failed.", detail: err.message }, { status: 502 });
  }
}
