/**
 * Configurazione Core per l'Integrazione Mapbox - L.O.T.O. App
 * Questo file funge da ponte tra Mapbox Studio e il codice dell'app.
 */

export const MAP_CONFIG = {
  // Centro Geografico: Taranto, Italia
  CENTER: {
    latitude: 40.473,
    longitude: 17.243,
  },
  // Limiti di Zoom per l'esperienza immersiva LOTO
  ZOOM: {
    min: 12,
    max: 18,
    initial: 14,
  },
  // Credenziali Mapbox (Studio & API)
  ACCESS_TOKEN: 'pk.eyJ1IjoibG90b2h1YiIsImEiOiJjbW5yOGY4bXYwMTliMnNzNG84c2YwbXFqIn0.wUjhbriAWqmuGh0tn-zHtw',
  STYLE_URL: 'mapbox://styles/lotohub/cmnww4mp8003r01sabgy4c0fr',
};

/**
 * Naming Convention per i Layer di Mapbox Studio
 * Assicurati che i nomi corrispondano esattamente a quelli definiti nel TileSet di Mapbox.
 */
export const LOTO_LAYERS = {
  FREE: 'layer-loto-free',         // POI ad accesso libero
  PARTNERS: 'layer-loto-partners', // Partner B2B (Lidi, Masserie, etc.)
  SECRETS: 'layer-loto-secrets',   // Luoghi nascosti sbloccabili
  ROUTES: 'layer-loto-routes',     // Percorsi sostenibili/accessibili
} as const;

/**
 * Branding Palette L.O.T.O.
 * Utilizzata per il rendering dinamico di marker, polyline e overlay sulla mappa.
 */
export const LOTO_PALETTE = {
  GREEN: '#4A5D23', // Colore primario LOTO (Sostenibilità)
  BLUE: '#0056D2',  // Partner / Costa Crociere
  GOLD: '#D96C4A',  // Punti di interesse / Badge Gold
} as const;

/**
 * Modello Dati per i Punti di Interesse (POI)
 * Interfaccia TypeScript per garantire la tipizzazione sicura dei dati GeoJSON.
 */
export interface LotoPOI {
  id: string | number;
  name: string;
  category: 'free' | 'partner' | 'secret';
  xp_reward: number;
  has_accessibility: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  image_url?: string;
}

/**
 * Tipo per le categorie dei layer
 */
export type LotoLayerCategory = keyof typeof LOTO_LAYERS;
