import { supabaseAdmin } from '@/lib/supabase'
import { MapPin, CheckCircle, XCircle, Star } from 'lucide-react'

// Forza il rendering lato server
export const dynamic = 'force-dynamic'

export default async function PoisPage() {
  // Nota: per ora prendiamo i dati grezzi. In Supabase JS le colonne PostGIS tornano 
  // formati binari/hex a meno che non usiamo una RPC o una View per estrarre ST_X e ST_Y.
  // Abbiamo l'RPC get_pois(), ma per l'admin serve tutto. 
  // Useremo qui la query base e poi creeremo una vista ad hoc per l'admin.
  const { data: pois, error } = await supabaseAdmin
    .from('pois')
    .select('id, name, category, xp_reward, is_active, is_recommended')
    .order('name', { ascending: true })

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500">Errore nel caricamento dei POI</h1>
        <p className="mt-4 text-gray-700">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Mete (POI)</h1>
          <p className="text-sm text-gray-500">
            Aggiungi nuove mete, modificale e forza il routing con "Mete Consigliate".
          </p>
        </div>
        <a href="/pois/new" className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
          + Nuova Meta
        </a>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nome
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Categoria
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Reward XP
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Stato (Attivo)
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Meta Consigliata
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Azioni</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {pois?.map((poi) => (
              <tr key={poi.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">{poi.name}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    {poi.category}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-green-600">
                  +{poi.xp_reward} XP
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  {poi.is_active ? (
                    <CheckCircle className="mx-auto h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="mx-auto h-5 w-5 text-red-500" />
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  {/* Toggle UI mock */}
                  <button 
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 ${
                      poi.is_recommended ? 'bg-amber-400' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        poi.is_recommended ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      {poi.is_recommended && <Star className="h-3 w-3 text-amber-500" />}
                    </span>
                  </button>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <a href="#" className="text-green-600 hover:text-green-900">
                    Modifica
                  </a>
                </td>
              </tr>
            ))}
            {(!pois || pois.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Nessun POI trovato nel database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
