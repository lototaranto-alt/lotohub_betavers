const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function test() {
    const supabaseUrl = 'http://127.0.0.1:54321';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMjU1MzYwMCwiZXhwIjoxOTM3OTI5NjAwfQ.YOUR_ANON_KEY_HERE'; // Local dev anon key is usually fixed
    
    // Read the actual env variables if available
    require('dotenv').config({ path: '.env' });
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL || supabaseUrl;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || supabaseKey;
    
    const supabase = createClient(url, key);
    
    console.log('Fetching tenants...');
    const { data, error } = await supabase
      .from('tenants')
      .select('*, localization:tenant_localizations(*)');
      
    console.log('Result:', JSON.stringify({ data, error }, null, 2));
}

test();
