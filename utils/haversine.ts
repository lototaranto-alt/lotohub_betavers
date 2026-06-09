/**
 * Calcola la distanza tra due coordinate GPS usando la formula di Haversine.
 * Ritorna una stringa formattata: metri (se < 1000) o chilometri (se >= 1000).
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  if (!lat1 || !lon1 || !lat2 || !lon2) return '...';

  const R = 6371e3; // Raggio della Terra in metri
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceInMeters = R * c;

  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  } else {
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  }
}
