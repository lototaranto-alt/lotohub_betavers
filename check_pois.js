require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPois() {
  console.log('Fetching pois...');
  const { data, error } = await supabase.from('pois').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${data.length} POIs in DB.`);
    data.forEach(p => {
      console.log(`- ID: ${p.id}, Title: ${p.title}, is_active: ${p.is_active}, layer_name: ${p.layer_name}`);
    });
  }
}

checkPois();
