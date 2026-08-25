import { supabaseAdmin } from '@/lib/supabase'
import { togglePremiumFeedback } from '@/actions/feedback'
import { MessageSquare, Star, Lock, Unlock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function FeedbacksPage() {
  const { data: feedbacks, error } = await supabaseAdmin
    .from('b2b_feedbacks')
    .select(`
      id,
      rating,
      comment,
      category,
      is_premium_unlocked,
      created_at,
      pois ( name )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8 text-red-500">
        <h1 className="text-2xl font-bold">Errore caricamento Whisper</h1>
        <p>{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shadow Feedbacks ("Whisper")</h1>
          <p className="text-sm text-gray-500">
            Leggi le recensioni anonime dei turisti e sblocca la visibilità per i partner Premium.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Luogo (Partner)</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rating & Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Commento (In Chiaro)</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Status Partner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {feedbacks?.map((fb) => (
              <tr key={fb.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="font-medium text-gray-900">{fb.pois?.name || 'Sconosciuto'}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(fb.created_at).toLocaleDateString('it-IT')}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: fb.rating || 0 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {fb.category || 'Generale'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start">
                    <MessageSquare className="mr-2 h-5 w-5 flex-shrink-0 text-gray-400 mt-0.5" />
                    <p className="text-sm text-gray-700 italic">
                      "{fb.comment}"
                    </p>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <form action={async () => {
                    'use server'
                    await togglePremiumFeedback(fb.id, fb.is_premium_unlocked)
                  }}>
                    <button 
                      type="submit"
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                        fb.is_premium_unlocked 
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {fb.is_premium_unlocked ? (
                        <>
                          <Unlock className="h-3.5 w-3.5" /> Premium Sbloccato
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" /> Bloccato (Freemium)
                        </>
                      )}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!feedbacks || feedbacks.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nessun Whisper trovato nel database.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
