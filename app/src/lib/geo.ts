/**
 * Utilitaires geographiques pour le calcul de distances GPS.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calcule la distance entre deux points GPS en kilometres (formule de Haversine).
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Formate une distance en km vers une chaine lisible.
 * Ex: 0.12 -> "120 m", 1.5 -> "1.5 km", 0.05 -> "50 m"
 */
export function formatDistanceToPoint(distKm: number): string {
  if (distKm < 1) {
    const meters = Math.round(distKm * 1000);
    return `${meters} m`;
  }
  return `${distKm.toFixed(1)} km`;
}
