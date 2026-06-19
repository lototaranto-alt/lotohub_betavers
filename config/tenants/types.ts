export interface TenantConfig {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    card: string;
    text: string;
    tint: string;
  };
  assets: {
    logoUrl: string;
    iconUrl: string;
    splashUrl: string;
  };
  mapboxStyle: string;
  center: {
    latitude: number;
    longitude: number;
  };
  boundaries: {
    type: "MultiPolygon" | "Polygon";
    coordinates: number[][][][]; // Formato standard GeoJSON per i poligoni
  };
}
