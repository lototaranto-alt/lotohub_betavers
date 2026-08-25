'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function toggleBanUser(profileId: string, currentStatus: boolean) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_banned: !currentStatus })
    .eq('id', profileId)

  if (error) {
    console.error("Errore durante il ban dell'utente:", error)
    throw new Error("Impossibile aggiornare lo stato di ban dell'utente.")
  }

  revalidatePath('/profiles')
}

export async function resetUserTokens(profileId: string) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ total_tokens: 0 })
    .eq('id', profileId)

  if (error) {
    console.error("Errore reset token:", error)
    throw new Error("Impossibile azzerare i token dell'utente.")
  }

  revalidatePath('/profiles')
}
