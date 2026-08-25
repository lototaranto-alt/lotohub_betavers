'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPoi(formData: FormData) {
  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const layer_name = formData.get('layer_name') as string
  const loto_quota_max = parseInt(formData.get('loto_quota_max') as string, 10)
  const xp_reward = parseInt(formData.get('xp_reward') as string, 10)
  const is_accessible = formData.get('is_accessible') === 'on'
  const latitude = parseFloat(formData.get('latitude') as string)
  const longitude = parseFloat(formData.get('longitude') as string)

  // Chiamata all'RPC sicura (usando SERVICE_ROLE_KEY)
  const { error } = await supabaseAdmin.rpc('insert_poi_standardized', {
    p_name: name,
    p_category: category,
    p_layer_name: layer_name,
    p_loto_quota_max: loto_quota_max,
    p_xp_reward: xp_reward,
    p_is_accessible: is_accessible,
    p_latitude: latitude,
    p_longitude: longitude,
  })

  if (error) {
    console.error("Errore RPC:", error)
    throw new Error('Errore durante il salvataggio del POI: ' + error.message)
  }

  // Se vogliamo renderlo "Meta Consigliata" direttamente alla creazione
  // potremmo farlo con un secondo update, ma per ora ci basta crearlo.

  revalidatePath('/pois')
  redirect('/pois')
}
