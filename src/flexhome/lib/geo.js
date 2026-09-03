// Admin-entered properties can carry a real latitude/longitude, but the
// seed data (and any listing an admin hasn't geocoded yet) doesn't. For
// those, the map page geocodes by city name against this lookup and
// scatters same-city pins with a deterministic jitter keyed off the
// property id, instead of stacking every listing in one city on a single
// point.
const CITY_COORDS = {
  "amsterdam": [52.3676, 4.9041],
  "copenhagen": [55.6761, 12.5683],
  "london": [51.5072, -0.1276],
  "munich": [48.1351, 11.5820],
  "new york city": [40.7128, -74.006],
  "paris": [48.8566, 2.3522],
  "berlin": [52.52, 13.405],
  "madrid": [40.4168, -3.7038],
  "rome": [41.9028, 12.4964],
  "barcelona": [41.3874, 2.1686],
  "dubai": [25.2048, 55.2708],
  "singapore": [1.3521, 103.8198],
  "los angeles": [34.0522, -118.2437],
  "san francisco": [37.7749, -122.4194],
  "chicago": [41.8781, -87.6298],
  "toronto": [43.6532, -79.3832],
  "sydney": [-33.8688, 151.2093],
  "tokyo": [35.6762, 139.6503],
  "vienna": [48.2082, 16.3738],
  "zurich": [47.3769, 8.5417],
  "stockholm": [59.3293, 18.0686],
  "oslo": [59.9139, 10.7522],
  "lisbon": [38.7223, -9.1393],
  "dublin": [53.3498, -6.2603],
};

function hashSeed(id) {
  const str = String(id);
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}

export function propertyCoords(property) {
  if (property.latitude != null && property.longitude != null) {
    return [Number(property.latitude), Number(property.longitude)];
  }

  const key = (property.city || "").trim().toLowerCase();
  const base = CITY_COORDS[key];
  if (!base) return null;

  const seed = hashSeed(property.id ?? property.slug ?? "0");
  const jitterLat = (((seed % 1000) / 1000) - 0.5) * 0.09;
  const jitterLng = ((((seed >> 3) % 1000) / 1000) - 0.5) * 0.09;
  return [base[0] + jitterLat, base[1] + jitterLng];
}
