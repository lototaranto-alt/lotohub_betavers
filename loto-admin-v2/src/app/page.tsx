import { supabase } from '@/lib/supabase'
import { Download, Users, CheckCircle, TrendingUp, MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getGithubDownloads() {
  try {
    const res = await fetch('https://api.github.com/repos/lototaranto-alt/loto-app-alpha/releases', {
      next: { revalidate: 3600 } // Cache di 1 ora per evitare rate limits
    })
    if (!res.ok) return 0
    const releases = await res.json()
    let total = 0
    releases.forEach((release: any) => {
      release.assets.forEach((asset: any) => {
        total += asset.download_count
      })
    })
    return total
  } catch (e) {
    return 0
  }
}

export default async function DashboardPage() {
  // Metrica 1: GitHub Downloads
  const totalDownloads = await getGithubDownloads()

  // Metrica 2: Ghost Users Count
  const { count: ghostUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Metrica 3: Check-in Volume
  const { count: totalCheckins } = await supabase
    .from('user_pois')
    .select('*', { count: 'exact', head: true })

  // Metrica 4: Heatmap Top 10 (Join manuale o chiamata a view)
  // Per l'MVP e usando anon key senza RPC complesse, facciamo un fetch limitato 
  // oppure usiamo la vista vw_admin_checkins se accessibile.
  const { data: topPois } = await supabase
    .from('user_pois')
    .select('poi_id, pois(name)')
    // Ideale: Group By, ma non supportato direttamente su anon rest API standard senza RPC.
    // Simuliamo la classifica tramite fetch (o RLS permettendo)
    // Se c'è una vista vw_admin_checkins_analytics, sarebbe meglio.
    // Assumiamo di usare una query grezza per MVP.
    .limit(1000)

  // Calcolo Top 10 in JS (MVP fallback)
  const poiCounts: Record<string, { name: string, count: number }> = {}
  topPois?.forEach((c: any) => {
    const id = c.poi_id
    const name = c.pois?.name || 'Sconosciuto'
    if (!poiCounts[id]) poiCounts[id] = { name, count: 0 }
    poiCounts[id].count += 1
  })
  const top10List = Object.values(poiCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Metrica 5: Whispers recenti
  const { data: whispers } = await supabase
    .from('b2b_feedbacks')
    .select('id, created_at, message, pois(name)')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Panoramica L.O.T.O.</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Download Reali (APK)</p>
            <p className="text-2xl font-bold text-slate-900">{totalDownloads}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Ghost Users (Profili)</p>
            <p className="text-2xl font-bold text-slate-900">{ghostUsers ?? 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Volume Check-in Totali</p>
            <p className="text-2xl font-bold text-slate-900">{totalCheckins ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top 10 POIs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800">Heatmap B2B (Top 10 P.O.I.)</h2>
          </div>
          <div className="p-6">
            <ul className="space-y-4">
              {top10List.length === 0 ? (
                <p className="text-sm text-slate-500">Nessun check-in rilevato.</p>
              ) : (
                top10List.map((poi, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">{idx + 1}. {poi.name}</span>
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      {poi.count} check-in
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Whispers */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold text-slate-800">La Posta del Cuore (Whispers)</h2>
          </div>
          <div className="p-0 max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Partner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Feedback Anonimo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {!whispers || whispers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">
                      Nessun whisper presente.
                    </td>
                  </tr>
                ) : (
                  whispers.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(w.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {w.pois?.name || 'N/D'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 italic">
                        "{w.message}"
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
