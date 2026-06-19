import { TenantConfig } from './types';
import { tarantoTenant } from './taranto';
import { lecceTenant } from './lecce';

export * from './types';

// Lista dei tenant registrati
export const TENANTS: TenantConfig[] = [
  tarantoTenant,
  lecceTenant,
];

// Fallback predefinito se non si ricade in nessun comune attivo
export const DEFAULT_TENANT = tarantoTenant;

/**
 * Helper client-side per verificare se un punto geografico ricade all'interno di un bounding box/poligono semplificato.
 * Ritorna l'ID del tenant se trovato, altrimenti null.
 */
export function findTenantByCoords(latitude: number, longitude: number): TenantConfig | null {
  for (const tenant of TENANTS) {
    const coords = tenant.boundaries.coordinates;
    for (const multipolygon of coords) {
      for (const polygon of multipolygon) {
        // Controllo semplice Bounding Box basato sui limiti del poligono per performance client-side
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const pt of polygon) {
          const [lon, lat] = pt;
          if (lon < minX) minX = lon;
          if (lon > maxX) maxX = lon;
          if (lat < minY) minY = lat;
          if (lat > maxY) maxY = lat;
        }

        // Se ricade nel Bounding Box semplificato del Comune
        if (longitude >= minX && longitude <= maxX && latitude >= minY && latitude <= maxY) {
          return tenant;
        }
      }
    }
  }
  return null;
}
