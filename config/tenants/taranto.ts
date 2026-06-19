import { TenantConfig } from './types';

export const tarantoTenant: TenantConfig = {
  id: 'taranto',
  name: 'Taranto',
  colors: {
    primary: '#4A5D23',     // Verde Oliva LOTO
    secondary: '#D96C4A',   // Terracotta LOTO
    background: '#F9F6EE',  // Crema LOTO (Chiaro)
    card: '#FFFFFF',
    text: '#1F1F1F',        // Ebano LOTO (Scuro)
    tint: '#4A5D23',
  },
  assets: {
    logoUrl: 'https://lotohub.s3.amazonaws.com/tenants/taranto/logo.png',
    iconUrl: 'https://lotohub.s3.amazonaws.com/tenants/taranto/icon.png',
    splashUrl: 'https://lotohub.s3.amazonaws.com/tenants/taranto/splash.png',
  },
  mapboxStyle: 'mapbox://styles/lotohub/cmnww4mp8003r01sabgy4c0fr',
  center: {
    latitude: 40.473,
    longitude: 17.243,
  },
  boundaries: {
    type: 'MultiPolygon',
    // Poligono semplificato esteso che circonda l'area metropolitana di Taranto (inclusi partner come Valle Rita, Canneto e Fatamorgana)
    coordinates: [
      [
        [
          [16.80, 40.30],
          [17.50, 40.30],
          [17.50, 40.55],
          [16.80, 40.55],
          [16.80, 40.30]
        ]
      ]
    ]
  }
};
