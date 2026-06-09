import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the auth header
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { base_co2, base_liters, base_tokens, party_size, is_takeaway } = await req.json()

    // 1. Logica di Calcolo Protetta
    const multiplier = party_size || 1
    let final_co2 = base_co2 * multiplier
    let final_liters = base_liters * multiplier
    let final_tokens = base_tokens * multiplier

    // Penalità Takeaway (15%)
    if (is_takeaway) {
      final_co2 *= 0.85
      final_liters *= 0.85
      final_tokens = Math.floor(final_tokens * 0.85)
    }

    // Calcolo XP: (kgCO2 * 100) + (Litri * 20)
    const final_xp = Math.floor((final_co2 * 100) + (final_liters * 20))

    // 2. Operazione Atomica (Aggiornamento profilo + Inserimento transazione)
    // Usiamo una RPC per atomicità garantita
    const { data, error: rpcError } = await supabaseClient.rpc('process_esg_impact', {
      user_id: user.id,
      p_co2: final_co2,
      p_liters: final_liters,
      p_tokens: final_tokens,
      p_xp: final_xp,
      p_takeaway: is_takeaway,
      p_party_size: multiplier
    })

    if (rpcError) throw rpcError

    return new Response(
      JSON.stringify({ 
        success: true, 
        xp_earned: final_xp, 
        co2_saved: final_co2, 
        liters_saved: final_liters, 
        tokens_earned: final_tokens 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
