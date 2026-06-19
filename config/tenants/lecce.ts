import { TenantConfig } from './types';

export const lecceTenant: TenantConfig = {
  id: 'lecce',
  name: 'Lecce',
  colors: {
    primary: '#C5A059',     // Oro Pietra Leccese
    secondary: '#6E5032',   // Marrone Barocco
    background: '#FAF8F5',  // Crema Chiaro
    card: '#FFFFFF',
    text: '#2A2521',        // Ebano Caldo
    tint: '#C5A059',
  },
  assets: {
    logoUrl: 'https://lotohub.s3.amazonaws.com/tenants/lecce/logo.png',
    iconUrl: 'https://lotohub.s3.amazonaws.com/tenants/lecce/icon.png',
    splashUrl: 'https://lotohub.s3.amazonaws.com/tenants/lecce/splash.png',
  },
  mapboxStyle: 'mapbox://styles/lotohub/cmnww4mp8003r01sabgy4c0fr', // Stesso studio Mapbox o alternativo
  center: {
    latitude: 40.352,
    longitude: 18.172,
  },
  boundaries: {
    type: 'MultiPolygon',
    // Poligono semplificato che circonda l'area urbana di Lecce
    coordinates: [
      [
        [
          [18.05, 40.25],
          [18.29, 40.25],
          [18.29, 40.45],
          [18.05, 40.45],
          [18.05, 40.25]
        ]
      ]
    ]
  }
};
