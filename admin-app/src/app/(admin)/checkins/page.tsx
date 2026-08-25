import { supabaseAdmin } from '@/lib/supabase'
import { Map, Activity, CalendarDays, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CheckinsPage() {
  const { data: analytics, error } = await supabaseAdmin
    .from('vw_admin_checkins_analytics')
    .select('*')
    .order('total_checkins', { ascending: false })

  if (error) {
    return (
      <div className="p-8 text-red-500">
        <h1 className="text-2xl font-bold">Errore caricamento analitiche</h1>
        <p>{error.message}</p>
      </div>
    )
  }

  // Calcoli globali
  const totalGlobalCheckins = analytics?.reduce((sum, row) => sum + Number(row.total_checkins || 0), 0) || 0
  const topPoi = analytics && analytics.length > 0 ? analytics[0] : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analitiche Check-in e Mappe di Calore</h1>
          <p className="text-sm text-gray-500">
            Reportistica aggregata (NFC scan) per partner e Comuni.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm border border-gray-200 sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Check-in Totali</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{totalGlobalCheckins}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm border border-gray-200 sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Mete Monitorate</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{analytics?.length || 0}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm border border-gray-200 sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Meta più popolare</dt>
          <dd className="mt-1 text-xl font-semibold tracking-tight text-indigo-600 truncate">
            {topPoi ? topPoi.poi_name : 'N/A'}
          </dd>
        </div>
      </div>

      {/* Tabella Dettaglio POI */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Luogo (POI)</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Categoria</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Status Routing</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Totale Check-in</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ultimo Passaggio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {analytics?.map((row) => (
              <tr key={row.poi_id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <Map className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">{row.poi_name}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {row.category}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  {row.is_recommended ? (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Consigliato (Forzato)</span>
                  ) : (
                    <span className="text-xs font-medium text-gray-500">Organico</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-gray-900">
                  <div className="flex items-center justify-end">
                    <Activity className="h-4 w-4 text-indigo-500 mr-1" />
                    {row.total_checkins}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                  {row.last_checkin 
                    ? new Date(row.last_checkin).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
                    : '-'}
                </td>
              </tr>
            ))}
            {(!analytics || analytics.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nessun dato disponibile.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
