import { supabaseAdmin } from '@/lib/supabase'
import { toggleBanUser, resetUserTokens } from '@/actions/profile'
import { User, ShieldAlert, Coins, RefreshCcw, Ban, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProfilesPage() {
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, nickname, total_xp, total_tokens, experience_level, is_banned')
    .order('total_xp', { ascending: false })

  if (error) {
    return (
      <div className="p-8 text-red-500">
        <h1 className="text-2xl font-bold">Errore caricamento profili</h1>
        <p>{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Profili Utente</h1>
          <p className="text-sm text-gray-500">
            Elenco avatar, moderazione (Anti-Cheat) e gestione ban.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nickname & ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Livello & XP</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Saldo Token (LOTO)</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Azioni Anti-Cheat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {profiles?.map((profile) => (
              <tr key={profile.id} className={profile.is_banned ? 'bg-red-50/50' : ''}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <User className="mr-2 h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{profile.nickname || 'Anonimo'}</div>
                      <div className="text-xs text-gray-500" title={profile.id}>
                        {profile.id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-900 font-semibold">Livello {profile.experience_level || 1}</div>
                  <div className="text-xs text-gray-500">{profile.total_xp || 0} XP</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center text-sm font-semibold text-amber-600">
                    <Coins className="mr-1 h-4 w-4" />
                    {profile.total_tokens || 0}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  {profile.is_banned ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      Bannato
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Attivo
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    {/* Azzeramento Token */}
                    <form action={async () => {
                      'use server'
                      await resetUserTokens(profile.id)
                    }}>
                      <button 
                        type="submit"
                        className="text-amber-600 hover:text-amber-900 flex items-center gap-1"
                        title="Azzera Token"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        <span className="hidden sm:inline">Azzera</span>
                      </button>
                    </form>
                    
                    {/* Toggle Ban */}
                    <form action={async () => {
                      'use server'
                      await toggleBanUser(profile.id, profile.is_banned)
                    }}>
                      <button 
                        type="submit"
                        className={`${profile.is_banned ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'} flex items-center gap-1`}
                        title={profile.is_banned ? "Sbanna Utente" : "Banna Utente"}
                      >
                        {profile.is_banned ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        <span className="hidden sm:inline">{profile.is_banned ? 'Riabilita' : 'Banna'}</span>
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {(!profiles || profiles.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nessun profilo trovato.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
