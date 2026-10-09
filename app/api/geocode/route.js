import { NextResponse } from "next/server";

// Public proxy for OpenStreetMap's free Nominatim geocoder, used by the
// homepage hero search-as-you-type location field and the seller wizard's
// map picker. No API key required — Nominatim's usage policy just wants a
// real identifying User-Agent and light request volume, which is why this
// stays server-side instead of being called directly from the browser.
//
//   ?q=<text>             → up to 5 matching places
//   ?lat=<n>&lon=<n>      → the single place at that point (reverse lookup)
const HEADERS = { "User-Agent": "FlexHome/1.0 (real estate search)" };

function toResult(place) {
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
    // Address parts, so a picked place can pre-fill the listing's address fields.
    parts: {
      street: [addr.house_number, addr.road].filter(Boolean).join(" ") || null,
      locality: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || null,
      state: addr.state || null,
      zip: addr.postcode || null,
      country: addr.country || null,
    },
  };
}

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q");
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const reverse = params.has("lat") && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  if (!reverse && (!q || !q.trim())) return NextResponse.json({ results: [] });

  try {
    const url = reverse
      ? `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=18&lat=${lat}&lon=${lon}`
      : `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return NextResponse.json({ error: "Lookup failed." }, { status: 502 });

    const raw = await res.json();
    const places = reverse ? (raw && !raw.error ? [raw] : []) : raw;
    return NextResponse.json({ results: places.map(toResult) });
  } catch (err) {
    return NextResponse.json({ error: "Lookup failed.", detail: err.message }, { status: 502 });
  }
}
