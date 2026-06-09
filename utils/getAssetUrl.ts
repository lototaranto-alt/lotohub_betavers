import { supabaseUrl } from './supabase';

// URL di base dinamico (estratto dalla configurazione di Supabase nel progetto).
// Se desideri inserire staticamente il tuo Project ID, puoi sbloccare questa riga:
// const PROJECT_ID = 'fsuolbwsvpgiglwcaffh'; // Inserisci qui il tuo Project ID se necessario
// export const STORAGE_ROOT = `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/loto-cities`;

export const STORAGE_ROOT = `${supabaseUrl}/storage/v1/object/public/loto-cities`;

/**
 * Restituisce l'URL completo dell'asset nel bucket pubblico di Supabase.
 * @param city La città corrente (es. 'taranto')
 * @param category La categoria dell'asset ('ui' | 'pois' | 'audio')
 * @param fileName Il nome del file (es. 'logo-LOTO.png')
 */
export function getAssetPath(
  city: string,
  category: 'ui' | 'pois' | 'audio',
  fileName: string
): string {
  const cleanCity = city.trim().toLowerCase();
  const cleanCategory = category.trim().toLowerCase();
  const cleanFileName = fileName.trim();

  return `${STORAGE_ROOT}/${cleanCity}/${cleanCategory}/${cleanFileName}`;
}
