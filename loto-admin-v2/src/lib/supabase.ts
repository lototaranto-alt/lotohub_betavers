import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Creiamo un client in read-only usando la chiave anonima.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
