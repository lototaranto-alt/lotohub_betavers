import { createEvent } from '@/actions/event'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
  // Fetch attivi per associare un POI all'evento
  const { data: pois } = await supabaseAdmin
    .from('pois')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nuovo Evento</h1>
        <Link href="/events" className="text-sm text-gray-500 hover:text-gray-900">
          Torna indietro
        </Link>
      </div>

      <form action={createEvent} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Titolo */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Titolo Evento</label>
            <input required type="text" name="title" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
          </div>

          {/* Tipo Evento */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select name="event_type" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
              <option value="web_public">Evento Pubblico (Web)</option>
              <option value="nodo_community">Nodo Community (Mecenatismo)</option>
            </select>
          </div>

          {/* XP Reward */}
          <div>
            <label className="block text-sm font-medium text-gray-700">XP Reward</label>
            <input required type="number" name="xp_reward" defaultValue="50" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
          </div>

          {/* Associazione POI */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Luogo (POI)</label>
            <select name="poi_id" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
              <option value="">-- Nessun POI (Evento Globale/Online) --</option>
              {pois?.map(poi => (
                <option key={poi.id} value={poi.id}>{poi.name}</option>
              ))}
            </select>
          </div>

          {/* Descrizione */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descrizione</label>
            <textarea name="description" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"></textarea>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Inizio (Data e Ora)</label>
            <input required type="datetime-local" name="start_time" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fine (Opzionale)</label>
            <input type="datetime-local" name="end_time" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            Pubblica Evento
          </button>
        </div>
      </form>
    </div>
  )
}
