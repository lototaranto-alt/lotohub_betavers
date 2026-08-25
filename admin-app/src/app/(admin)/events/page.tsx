import { supabaseAdmin } from '@/lib/supabase'
import { Calendar, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const { data: events, error } = await supabaseAdmin
    .from('events')
    .select(`
      *,
      pois ( name )
    `)
    .order('start_time', { ascending: false })

  if (error) {
    return (
      <div className="p-8 text-red-500">
        <h1 className="text-2xl font-bold">Errore caricamento eventi</h1>
        <p>{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Eventi</h1>
          <p className="text-sm text-gray-500">
            Crea eventi temporanei, Nodi Community e gestisci l'agenda.
          </p>
        </div>
        <Link href="/events/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
          + Nuovo Evento
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Titolo & Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Luogo (POI)</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Data e Ora</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reward</th>
              <th className="relative px-6 py-3"><span className="sr-only">Azioni</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {events?.map((evt) => (
              <tr key={evt.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-indigo-400" />
                    <div>
                      <div className="font-medium text-gray-900">{evt.title}</div>
                      <div className="text-xs text-gray-500">{evt.event_type}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {evt.pois?.name ? (
                    <span className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4 text-gray-400" />
                      {evt.pois.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Nessun POI associato</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4 text-gray-400" />
                    {new Date(evt.start_time || evt.event_date).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-green-600">
                  +{evt.xp_reward} XP
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900">Modifica</button>
                </td>
              </tr>
            ))}
            {(!events || events.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nessun evento trovato.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
