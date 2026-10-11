import { requireAdmin } from '@/lib/supabase-server'
import { Download, Users, AlertTriangle, Leaf, MapPin, MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getGithubDownloads() {
  try {
    const res = await fetch('https://api.github.com/repos/lototaranto-alt/loto-app-alpha/releases', {
      next: { revalidate: 3600 }
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
  const { supabase } = await requireAdmin()
  const totalDownloads = await getGithubDownloads()

  const { data: ghostUsers } = await supabase.rpc('count_profiles')

  // Recuperiamo i check-in per le metriche (Anti-Frode, ESG, Leaderboard)
  const { data: userPois } = await supabase
    .from('user_pois')
    .select('is_shadowbanned, co2_saved, poi_id, pois(name)')
    .limit(5000)

  // 1. Radar Anti-Frode
  const shadowbannedCount = userPois?.filter(p => p.is_shadowbanned).length || 0

  // 2. Bilancio ESG (Sostenibilità)
  const totalCo2Saved = userPois?.reduce((acc, p) => acc + (Number(p.co2_saved) || 0), 0) || 0
  const alberiPiantati = Math.floor(totalCo2Saved / 20)

  // 3. Leaderboard Turistica (Top 5 POI validi)
  const validCheckins = userPois?.filter(p => !p.is_shadowbanned) || []
  const poiCounts: Record<string, { name: string, count: number }> = {}
  
  validCheckins.forEach((c: any) => {
    const id = c.poi_id
    const rawName = c.pois?.name
    const name = (Array.isArray(c.pois) ? c.pois[0]?.name : rawName) || 'P.O.I. Sconosciuto'
    if (!poiCounts[id]) poiCounts[id] = { name, count: 0 }
    poiCounts[id].count += 1
  })
  
  const top5List = Object.values(poiCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Metrica Whispers
  const { data: whispers } = await supabase
    .from('b2b_feedbacks')
    .select('id, created_at, message, pois(name)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Centro di Comando L.O.T.O.</h1>
      </div>

      {/* 3 CRUSCOTTI KILLER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Widget 1: Radar Anti-Frode */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0 opacity-50" />
          <div className="flex items-center space-x-3 z-10 mb-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Radar Anti-Frode</h2>
          </div>
          <div className="z-10">
            <p className="text-4xl font-black text-slate-800">{shadowbannedCount}</p>
            <p className="text-sm font-semibold text-red-500 mt-1">Falsi Check-in GPS Bloccati</p>
          </div>
        </div>

        {/* Widget 2: Bilancio ESG */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-50" />
          <div className="flex items-center space-x-3 z-10 mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Leaf className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Bilancio ESG</h2>
          </div>
          <div className="z-10">
            <p className="text-4xl font-black text-slate-800">{totalCo2Saved.toFixed(1)} <span className="text-xl text-slate-400">KG</span></p>
            <p className="text-sm font-semibold text-emerald-600 mt-1">
              CO₂ Risparmiata • Equivalente a <span className="underline">{alberiPiantati} alberi piantati</span>
            </p>
          </div>
        </div>

        {/* Widget 3: Metriche Generiche */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 flex flex-col justify-between">
           <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Download className="w-4 h-4 text-blue-500"/> Download APK</span>
              <span className="text-lg font-black text-slate-800">{totalDownloads}</span>
           </div>
           <div className="flex justify-between items-center pt-3">
              <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Users className="w-4 h-4 text-purple-500"/> Utenti Fantasma</span>
              <span className="text-lg font-black text-slate-800">{Number(ghostUsers ?? 0)}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Leaderboard Turistica (Top 5) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
            <MapPin className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-extrabold text-slate-800">Leaderboard Turistica (Top 5 P.O.I.)</h2>
          </div>
          <div className="p-6">
            <ul className="space-y-5">
              {top5List.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Nessun check-in valido rilevato.</p>
              ) : (
                top5List.map((poi, idx) => (
                  <li key={idx} className="flex justify-between items-center group">
                    <div className="flex items-center space-x-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{poi.name}</span>
                    </div>
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full shadow-sm">
                      {poi.count} VISITE
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Whispers */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
            <MessageSquare className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-extrabold text-slate-800">La Posta del Cuore (Whispers)</h2>
          </div>
          <div className="p-0 flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
            <table className="min-w-full divide-y divide-slate-100">
              <tbody className="bg-white divide-y divide-slate-50">
                {!whispers || whispers.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-slate-500 text-sm">
                      Nessun feedback presente.
                    </td>
                  </tr>
                ) : (
                  whispers.map((w: any) => {
                    const poiName = (Array.isArray(w.pois) ? w.pois[0]?.name : w.pois?.name) || 'N/D'
                    return (
                      <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-400">
                          {new Date(w.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-800 mb-1">{poiName}</p>
                          <p className="text-sm text-slate-600 italic">&quot;{w.message}&quot;</p>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  )
}
