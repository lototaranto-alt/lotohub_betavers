'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function togglePremiumFeedback(feedbackId: string, currentStatus: boolean) {
  const { error } = await supabaseAdmin
    .from('b2b_feedbacks')
    .update({ is_premium_unlocked: !currentStatus })
    .eq('id', feedbackId)

  if (error) {
    console.error("Errore toggle premium:", error)
    throw new Error('Errore durante l\'aggiornamento del feedback')
  }

  revalidatePath('/feedbacks')
}
