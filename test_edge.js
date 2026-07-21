const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Leggiamo l'URL e la KEY dal file .env.local se possibile, oppure mockiamo
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.log('Credenziali non trovate.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdgeFunction() {
  console.log('Invocazione Edge Function...');
  const { data, error } = await supabase.functions.invoke('calculate-esg-impact', {
    body: { poi_id: 'test', receipt_hash: 'test_hash' }
  });
  console.log('Result Data:', data);
  console.log('Result Error:', error);
}

testEdgeFunction();
