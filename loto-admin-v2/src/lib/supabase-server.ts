import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export type AdminRole = 'admin' | 'analyst' | 'viewer'

export type AdminContext = {
  supabase: SupabaseClient
  user: User
  profile: {
    id: string
    admin_role: AdminRole | null
  }
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export function createAdminServerClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Configurazione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY mancante.')
  }

  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {}
      },
    },
  })
}

export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  if (!isSupabaseConfigured) return null

  const supabase = createAdminServerClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  const user = userData.user

  if (userError || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, admin_role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) return null

  const adminRole = profile.admin_role as AdminRole | null
  if (adminRole !== 'admin' && adminRole !== 'analyst') return null

  return {
    supabase,
    user,
    profile: {
      id: profile.id,
      admin_role: adminRole,
    },
  }
})

export async function requireAdmin() {
  const context = await getAdminContext()

  if (!context) {
    redirect('/login')
  }

  return context
}
