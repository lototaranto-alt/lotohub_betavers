'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEvent(formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const event_type = formData.get('event_type') as string
  const poi_id = formData.get('poi_id') as string || null
  const xp_reward = parseInt(formData.get('xp_reward') as string, 10)
  
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string || null

  const { error } = await supabaseAdmin.from('events').insert({
    title,
    description,
    event_type,
    poi_id,
    xp_reward,
    start_time,
    end_time,
    event_date: start_time // Retrocompatibilità per vecchie query
  })

  if (error) {
    console.error("Errore inserimento evento:", error)
    throw new Error('Errore durante il salvataggio: ' + error.message)
  }

  revalidatePath('/events')
  redirect('/events')
}
