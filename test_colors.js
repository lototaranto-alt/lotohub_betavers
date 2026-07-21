const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkColors() {
  const { data, error } = await supabase.from('tenants').select('id, primary_color, secondary_color');
  console.log(data);
}

checkColors();
