const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const sb = createClient(url, key);

sb.auth.signInAnonymously()
  .then(r => console.log('Result:', r.data.user ? 'Success: ' + r.data.user.id : 'No User'))
  .catch(e => console.log('Error:', e));
