// ---------------------------------------------------------------------------
// Geo utilities
// ---------------------------------------------------------------------------

/**
 * Haversine distance between two lat/lng points.
 * Returns distance in **metres**.
 *
 * The Haversine formula calculates the great-circle distance between
 * two points on a sphere given their longitudes and latitudes:
 *
 *   a = sin²(Δφ/2) + cos(φ1)·cos(φ2)·sin²(Δλ/2)
 *   c = 2·atan2(√a, √(1−a))
 *   d = R · c
 *
 * where R is the Earth's radius (6 371 000 m) and φ/λ are in radians.
 */
const EARTH_RADIUS_M = 6_371_000;

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lng2 - lng1);

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/**
 * Format a distance in metres for display.
 * Under 1 km → "423 m", otherwise → "3.2 km".
 */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

/** ~100 m — the GPS-verification radius for rating submission. */
export const RATING_RADIUS_M = 100;
