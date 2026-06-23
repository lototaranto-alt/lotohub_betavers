import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAndLink() {
  console.log('Inizio upload immagini...');

  const images = [
    { file: 'poi_mudi.jpg', nameLike: 'MuDi' },
    { file: 'poi_oasi.png', nameLike: 'Oasi' },
    { file: 'eco_bg.png', nameLike: 'Castello' } // Esempio per fallback
  ];

  for (const img of images) {
    const filePath = path.join(__dirname, 'assets', 'images', img.file);
    if (!fs.existsSync(filePath)) {
      console.log(`[SKIP] File ${img.file} non trovato localmente.`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload al bucket
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('loto-media')
      .upload(`pois/${img.file}`, fileBuffer, {
        upsert: true,
        contentType: img.file.endsWith('.png') ? 'image/png' : 'image/jpeg'
      });

    if (uploadError) {
      console.error(`Errore upload ${img.file}:`, uploadError.message);
      continue;
    }

    // Ottieni URL pubblico
    const { data: publicUrlData } = supabase.storage.from('loto-media').getPublicUrl(`pois/${img.file}`);
    const publicUrl = publicUrlData.publicUrl;
    console.log(`[UPLOADED] ${img.file} -> ${publicUrl}`);

    // Aggiorna tabella pois
    // Troviamo il POI che contiene il nome specificato
    const { data: pois, error: poiError } = await supabase
      .from('pois')
      .select('id, name')
      .ilike('name', `%${img.nameLike}%`);

    if (poiError) {
      console.error(`Errore ricerca POI per ${img.nameLike}:`, poiError.message);
      continue;
    }

    for (const poi of pois || []) {
      const { error: updateErr } = await supabase
        .from('pois')
        .update({ image_url: publicUrl })
        .eq('id', poi.id);

      if (updateErr) {
        console.error(`Errore aggiornamento POI ${poi.name}:`, updateErr.message);
      } else {
        console.log(`[LINKED] Immagine collegata al POI: ${poi.name}`);
      }
    }
  }

  console.log('Completato!');
}

uploadAndLink();
