import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// WARNING: Service Role Key grants admin privileges, bypassing RLS.
// USE ONLY IN SERVER COMPONENTS / ACTIONS. NEVER EXPOSE TO CLIENT.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
