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

/**
 * Calcule la distance perpendiculaire d'un point a une ligne (segment GPS).
 * Formule: distance du point a la ligne definie par deux points.
 * @param point - Point {lat, lon} dont on veut calculer la distance a la ligne
 * @param lineStart - Debut de la ligne {lat, lon}
 * @param lineEnd - Fin de la ligne {lat, lon}
 * @returns Distance en kilometres
 */
function perpendicularDistance(
  point: { latitude: number; longitude: number },
  lineStart: { latitude: number; longitude: number },
  lineEnd: { latitude: number; longitude: number },
): number {
  // Distance du segment
  const segmentDist = haversineDistance(
    lineStart.latitude,
    lineStart.longitude,
    lineEnd.latitude,
    lineEnd.longitude,
  );

  // Si le segment est pratiquement un point, retourner la distance du point au segment
  if (segmentDist === 0) {
    return haversineDistance(
      point.latitude,
      point.longitude,
      lineStart.latitude,
      lineStart.longitude,
    );
  }

  // Calculer la projection du point sur la ligne
  // On utilise une approximation en coordonnees cartesiennes locales pour eviter
  // les complications avec les geodesiques sur une sphere
  const R = EARTH_RADIUS_KM;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat0 = toRad(lineStart.latitude);
  const lon0 = toRad(lineStart.longitude);
  const lat1 = toRad(lineEnd.latitude);
  const lon1 = toRad(lineEnd.longitude);
  const latP = toRad(point.latitude);
  const lonP = toRad(point.longitude);

  // Coordonnees cartesiennes locales (approximation pour petites distances)
  const x0 = R * lon0 * Math.cos(lat0);
  const y0 = R * lat0;
  const x1 = R * lon1 * Math.cos(lat1);
  const y1 = R * lat1;
  const xP = R * lonP * Math.cos(latP);
  const yP = R * latP;

  // Vecteur ligne et vecteur point-debut
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dpx = xP - x0;
  const dpy = yP - y0;

  // Projection scalaire
  const t = (dpx * dx + dpy * dy) / (dx * dx + dy * dy);

  // Clamp a [0, 1] pour rester sur le segment
  const tClamped = Math.max(0, Math.min(1, t));

  // Point projete sur la ligne
  const xProj = x0 + tClamped * dx;
  const yProj = y0 + tClamped * dy;

  // Distance euclidienne en coordonnees cartesiennes (deja en km car x,y = R * rad)
  const perpDistKm = Math.sqrt((xP - xProj) ** 2 + (yP - yProj) ** 2);

  return perpDistKm;
}

/**
 * Simplifie une trace GPS avec l'algorithme Douglas-Peucker.
 * Reduit le nombre de points tout en conservant la forme generale de la trace.
 * @param points - Array de {latitude, longitude}
 * @param epsilon - Tolerance en kilometres (defaut: 0.01 km = 10 metres pour randonnee)
 * @returns Points simplifies (toujours inclut le premier et le dernier point)
 */
export function douglasPeucker(
  points: Array<{ latitude: number; longitude: number }>,
  epsilon: number = 0.01,
): Array<{ latitude: number; longitude: number }> {
  if (points.length <= 2) return points;

  // Trouver le point le plus eloigne de la ligne debut-fin
  let maxDist = 0;
  let maxIdx = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  // Si la distance max > epsilon, on divise et on applique recursivement
  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIdx), epsilon);
    // Concatener en evitant la duplication du point au milieu
    return left.slice(0, -1).concat(right);
  }

  // Sinon, on garde seulement le debut et la fin
  return [points[0], points[points.length - 1]];
}
