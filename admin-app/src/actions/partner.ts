'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function updatePartnerPlan(poiId: string, newPlan: string) {
  const { error } = await supabaseAdmin
    .from('pois')
    .update({ b2b_plan: newPlan })
    .eq('id', poiId)

  if (error) {
    console.error("Errore aggiornamento piano:", error)
    throw new Error('Errore durante l\'aggiornamento del piano')
  }

  revalidatePath('/partners')
}
