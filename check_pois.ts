import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPOIs() {
  const { data, error } = await supabase.from('pois').select('id, name, image_url');
  if (error) {
    console.error('Error fetching POIs:', error);
  } else {
    console.log('POIs:', data);
  }
}

checkPOIs();
