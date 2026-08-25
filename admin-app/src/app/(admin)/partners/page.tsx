import { supabaseAdmin } from '@/lib/supabase'
import { updatePartnerPlan } from '@/actions/partner'

// Forza il rendering dinamico per evitare cache stale
export const dynamic = 'force-dynamic'

export default async function PartnersPage() {
  // 1. Recuperiamo tutti i POI di categoria 'partner'
  const { data: partners, error: partnersError } = await supabaseAdmin
    .from('pois')
    .select('id, name, b2b_phone, b2b_plan, nfc_activated_at')
    .eq('category', 'partner')
    .order('name')

  if (partnersError) {
    return <div className="p-8 text-red-500">Errore: {partnersError.message}</div>
  }

  // 2. Recuperiamo i conteggi (check-in e whisper) per ogni partner
  // Per semplicità e velocità, facciamo due query separate aggregate 
  // (In produzione su larga scala si userebbe una RPC o una View SQL dedicata come abbiamo fatto per il cron)
  
  const partnerIds = partners.map(p => p.id)
  
  let checkinsCount: Record<string, number> = {}
  let whispersCount: Record<string, number> = {}

  if (partnerIds.length > 0) {
    const { data: checkins } = await supabaseAdmin
      .from('user_pois')
      .select('poi_id')
      .in('poi_id', partnerIds)
      
    if (checkins) {
      checkins.forEach(c => {
        checkinsCount[c.poi_id] = (checkinsCount[c.poi_id] || 0) + 1
      })
    }

    const { data: whispers } = await supabaseAdmin
      .from('b2b_feedbacks')
      .select('poi_id')
      .in('poi_id', partnerIds)

    if (whispers) {
      whispers.forEach(w => {
        whispersCount[w.poi_id] = (whispersCount[w.poi_id] || 0) + 1
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestione Partner B2B</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Partner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato NFC
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contatti
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check-in Totali
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Whispers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Piano Attuale
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni (Upsell)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {partners?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Nessun partner B2B trovato nel database.
                </td>
              </tr>
            )}
            {partners?.map((p) => {
              const plan = p.b2b_plan || 'freemium'
              const isPremium = plan === 'premium'

              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{p.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {p.nfc_activated_at ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Attivo
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Da Attivare
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {p.b2b_phone || 'Nessun numero'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                    {checkinsCount[p.id] || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                    {whispersCount[p.id] || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full ${
                      isPremium 
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <form action={async () => {
                      'use server'
                      const newPlan = isPremium ? 'freemium' : 'premium'
                      await updatePartnerPlan(p.id, newPlan)
                    }}>
                      <button 
                        type="submit"
                        className={`px-4 py-2 rounded-lg font-semibold text-xs transition-colors shadow-sm ${
                          isPremium 
                            ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                      >
                        {isPremium ? '↓ Downgrade' : '⭐ UPGRADE ELITE'}
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
