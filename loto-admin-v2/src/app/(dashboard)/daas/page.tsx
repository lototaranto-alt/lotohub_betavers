import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock3,
  Database,
  Droplets,
  Leaf,
  Map,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react'
import {
  getDaasSnapshot,
  type DaasSection,
  type EsgMonthlyRow,
  type EventAttendanceRow,
  type HeatmapRow,
  type TelemetryDailyRow,
} from '@/lib/daas'

export const dynamic = 'force-dynamic'

const decimalFormatter = new Intl.NumberFormat('it-IT', {
  maximumFractionDigits: 1,
})

const integerFormatter = new Intl.NumberFormat('it-IT', {
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const dateTimeFormatter = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDecimal(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? decimalFormatter.format(value)
    : '—'
}

function formatInteger(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? integerFormatter.format(value)
    : '—'
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

function sum(rows: Record<string, unknown>[], key: string) {
  return rows.reduce((total, row) => {
    const value = row[key]
    return total + (typeof value === 'number' && Number.isFinite(value) ? value : 0)
  }, 0)
}

function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  children?: ReactNode
}) {
  return (
    <div id={id} className="scroll-mt-8 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-900 p-3 text-emerald-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">{eyebrow}</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

function ViewStatus({ error, count }: { error: string | null; count: number }) {
  if (error) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
        <CircleAlert className="h-3.5 w-3.5" />
        Vista non disponibile
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
      <CircleCheck className="h-3.5 w-3.5" />
      {formatInteger(count)} righe
    </span>
  )
}

function DataMessage({ error, empty, children }: { error: string | null; empty: boolean; children: ReactNode }) {
  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-800">
        <div className="flex items-center gap-2 font-bold">
          <AlertTriangle className="h-4 w-4" />
          Query non disponibile
        </div>
        <p className="mt-2 leading-6">{error}</p>
      </div>
    )
  }

  if (empty) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <Database className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-600">Nessun dato disponibile</p>
        <p className="mt-1 text-xs text-slate-400">La vista è accessibile ma non contiene ancora record.</p>
      </div>
    )
  }

  return <>{children}</>
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'emerald',
}: {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone?: 'emerald' | 'blue' | 'amber' | 'violet'
}) {
  const tones = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <span className={`rounded-xl p-2 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
    </div>
  )
}

function SectionLink({ href, label, icon: Icon, active = false }: { href: string; label: string; icon: LucideIcon; active?: boolean }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
        active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm font-bold">{label}</span>
    </a>
  )
}

function HeatmapTable({ rows }: { rows: HeatmapRow[] }) {
  const maxCheckins = Math.max(...rows.map((row) => row.checkins || 0), 1)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-3">Griglia</th>
            <th className="px-5 py-3">Finestra 15 min</th>
            <th className="px-5 py-3">POI</th>
            <th className="px-5 py-3">Check-in</th>
            <th className="px-5 py-3">Visitatori</th>
            <th className="px-5 py-3">CO₂</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.slice(0, 12).map((row, index) => {
            const width = Math.max(((row.checkins || 0) / maxCheckins) * 100, 4)
            return (
              <tr key={`${row.time_block || 'block'}-${row.poi_id || 'poi'}-${index}`} className="hover:bg-slate-50">
                <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                  {formatDecimal(row.grid_lat)}, {formatDecimal(row.grid_lng)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDateTime(row.time_block)}</td>
                <td className="px-5 py-4 text-xs font-bold text-slate-800">{row.poi_id || '—'}</td>
                <td className="px-5 py-4">
                  <div className="flex min-w-28 items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${width}%` }} />
                    </div>
                    <span className="text-xs font-black text-indigo-700">{formatInteger(row.checkins)}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-xs font-semibold text-slate-600">{formatInteger(row.unique_visitors)}</td>
                <td className="px-5 py-4 text-xs font-semibold text-emerald-700">{formatDecimal(row.co2_saved_kg)} kg</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EsgTable({ rows }: { rows: EsgMonthlyRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-3">Mese</th>
            <th className="px-5 py-3">Check-in</th>
            <th className="px-5 py-3">Utenti attivi</th>
            <th className="px-5 py-3">CO₂</th>
            <th className="px-5 py-3">Litri</th>
            <th className="px-5 py-3">PTI</th>
            <th className="px-5 py-3">Report civici</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr key={row.month || index} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-5 py-4 text-xs font-bold text-slate-800">{formatDate(row.month)}</td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-600">{formatInteger(row.checkins)}</td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-600">{formatInteger(row.active_users)}</td>
              <td className="px-5 py-4 text-xs font-semibold text-emerald-700">{formatDecimal(row.co2_saved)} kg</td>
              <td className="px-5 py-4 text-xs font-semibold text-blue-700">{formatDecimal(row.liters_saved)} L</td>
              <td className="px-5 py-4 text-xs font-semibold text-violet-700">{formatInteger(row.pti_generated)}</td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                {formatInteger(row.confirmed_reports)} confermati · {formatInteger(row.pending_reports)} pending
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EventAttendanceTable({ rows }: { rows: EventAttendanceRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-3">Evento</th>
            <th className="px-5 py-3">Data</th>
            <th className="px-5 py-3">Tenant</th>
            <th className="px-5 py-3">Partecipanti</th>
            <th className="px-5 py-3">Check-in</th>
            <th className="px-5 py-3">CO₂</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr key={row.event_id || index} className="hover:bg-slate-50">
              <td className="px-5 py-4">
                <p className="text-sm font-bold text-slate-800">{row.event_title || 'Evento senza titolo'}</p>
                <p className="mt-1 text-xs text-slate-400">{row.poi_id || 'POI non associato'}</p>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-600">{formatDate(row.event_date)}</td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-600">{row.tenant_id || '—'}</td>
              <td className="px-5 py-4 text-xs font-black text-indigo-700">{formatInteger(row.participants)}</td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-600">{formatInteger(row.checkins)}</td>
              <td className="px-5 py-4 text-xs font-semibold text-emerald-700">{formatDecimal(row.co2_saved)} kg</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TelemetryTable({ rows }: { rows: TelemetryDailyRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-3">Giorno</th>
            <th className="px-5 py-3">Evento</th>
            <th className="px-5 py-3">Versione</th>
            <th className="px-5 py-3">OS</th>
            <th className="px-5 py-3">Eventi</th>
            <th className="px-5 py-3">Utenti coinvolti</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr key={`${row.day || 'day'}-${row.event_name || 'event'}-${index}`} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-5 py-4 text-xs font-bold text-slate-800">{formatDate(row.day)}</td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-600">{row.event_name || '—'}</td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-500">{row.app_version || '—'}</td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-500">{row.os_name || '—'}</td>
              <td className="px-5 py-4 text-xs font-black text-violet-700">{formatInteger(row.events)}</td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-600">{formatInteger(row.affected_users)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function DaasReportsPage() {
  const snapshot = await getDaasSnapshot()
  const latestEsg = snapshot.esgMonthly[0]
  const latestEvent = snapshot.eventAttendance[0]
  const totalEsgCheckins = sum(snapshot.esgMonthly as unknown as Record<string, unknown>[], 'checkins')
  const totalEsgCo2 = sum(snapshot.esgMonthly as unknown as Record<string, unknown>[], 'co2_saved')
  const totalHeatmapCheckins = sum(snapshot.heatmap as unknown as Record<string, unknown>[], 'checkins')
  const totalEventParticipants = sum(snapshot.eventAttendance as unknown as Record<string, unknown>[], 'participants')
  const totalTelemetryEvents = sum(snapshot.telemetryDaily as unknown as Record<string, unknown>[], 'events')
  const errorEntries = Object.entries(snapshot.errors).filter(([, message]) => Boolean(message)) as Array<[DaasSection, string]>

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col gap-6 rounded-3xl bg-slate-900 p-7 text-white shadow-xl lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
            <BarChart3 className="h-4 w-4" />
            L.O.T.O. Intelligence
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Report DaaS</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Snapshot read-only dei dati aggregati, preparati per il reporting a enti, agenzie e partner. Nessun dato identificativo viene ricalcolato nel browser.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3">
          <RefreshCw className="h-4 w-4 text-emerald-400" />
          <div>
            <p className="text-xs font-bold text-white">Snapshot server-side</p>
            <p className="mt-1 text-[11px] text-slate-400">Aggiornato ad ogni visita</p>
          </div>
        </div>
      </header>

      <nav className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Sezioni report DaaS">
        <SectionLink href="#overview" label="Panoramica" icon={BarChart3} active />
        <SectionLink href="#heatmap" label="Decongestione" icon={Map} />
        <SectionLink href="#esg" label="ESG mensile" icon={Leaf} />
        <SectionLink href="#events" label="Eventi" icon={CalendarDays} />
        <SectionLink href="#telemetry" label="Telemetria tecnica" icon={Activity} />
      </nav>

      {errorEntries.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold text-amber-900">Alcune viste non sono ancora raggiungibili</p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                La dashboard resta utilizzabile: le sezioni interessate mostrano lo stato della query invece di inventare metriche.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-amber-800">
                {errorEntries.map(([section, message]) => (
                  <li key={section}>
                    <span className="font-bold uppercase tracking-wider">{section}:</span> {message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <section className="space-y-5">
        <SectionHeader
          id="overview"
          eyebrow="Sintesi operativa"
          title="Panoramica dati"
          description="I numeri principali derivano dalle viste DaaS e vengono ricalcolati dal database, non dal frontend."
          icon={BarChart3}
        >
          <ViewStatus error={null} count={snapshot.esgMonthly.length + snapshot.heatmap.length + snapshot.eventAttendance.length} />
        </SectionHeader>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="CO₂ ultimo mese"
            value={`${formatDecimal(latestEsg?.co2_saved)} kg`}
            detail={latestEsg ? formatDate(latestEsg.month) : 'Nessun mese disponibile'}
            icon={Leaf}
            tone="emerald"
          />
          <MetricCard
            label="Check-in decongestione"
            value={formatInteger(totalHeatmapCheckins)}
            detail="Aggregati heatmap · 15 minuti"
            icon={MapPin}
            tone="blue"
          />
          <MetricCard
            label="Partecipanti eventi"
            value={formatInteger(totalEventParticipants)}
            detail={latestEvent ? latestEvent.event_title || 'Ultimo evento disponibile' : 'Nessun evento disponibile'}
            icon={CalendarDays}
            tone="violet"
          />
          <MetricCard
            label="Check-in ESG cumulati"
            value={formatInteger(totalEsgCheckins)}
            detail={`${formatDecimal(totalEsgCo2)} kg CO₂ aggregati`}
            icon={ArrowUpRight}
            tone="amber"
          />
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader
          id="heatmap"
          eyebrow="Report PA · Zero-PII"
          title="Heatmap di decongestione"
          description="Griglia territoriale aggregata e bucket temporali di 15 minuti. È il report operativo per capire dove devono essere dirottati i flussi."
          icon={Map}
        >
          <ViewStatus error={snapshot.errors.heatmap} count={snapshot.heatmap.length} />
        </SectionHeader>
        <DataMessage error={snapshot.errors.heatmap} empty={snapshot.heatmap.length === 0}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Map className="h-4 w-4 text-indigo-500" />
                Ultimi bucket territoriali
              </div>
              <p className="text-xs font-semibold text-slate-500">Coordinate arrotondate · nessun identificativo utente</p>
            </div>
            <HeatmapTable rows={snapshot.heatmap} />
          </div>
        </DataMessage>
      </section>

      <section className="space-y-5">
        <SectionHeader
          id="esg"
          eyebrow="Report B2B · Impatto"
          title="ESG mensile"
          description="Riepilogo mensile di attività, CO₂, acqua risparmiata, PTI, XP e segnalazioni civichecertificate."
          icon={Leaf}
        >
          <ViewStatus error={snapshot.errors.esg} count={snapshot.esgMonthly.length} />
        </SectionHeader>
        <DataMessage error={snapshot.errors.esg} empty={snapshot.esgMonthly.length === 0}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Utenti attivi" value={formatInteger(latestEsg?.active_users)} detail="Ultimo mese disponibile" icon={Users} tone="blue" />
            <MetricCard label="Litri risparmiati" value={`${formatDecimal(latestEsg?.liters_saved)} L`} detail="Ledger aggregato" icon={Droplets} tone="blue" />
            <MetricCard label="PTI generati" value={formatInteger(latestEsg?.pti_generated)} detail="Impatto civico" icon={ShieldCheck} tone="violet" />
            <MetricCard label="XP generati" value={formatInteger(latestEsg?.xp_earned)} detail="Progressione utenti" icon={BarChart3} tone="amber" />
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Leaf className="h-4 w-4 text-emerald-500" />
                Storico mensile
              </div>
              <span className="text-xs font-semibold text-slate-500">Ultimi 12 mesi</span>
            </div>
            <EsgTable rows={snapshot.esgMonthly} />
          </div>
        </DataMessage>
      </section>

      <section className="space-y-5">
        <SectionHeader
          id="events"
          eyebrow="Report associazioni · Attivazione"
          title="Affluenza eventi"
          description="Partecipanti e impatto stimato dagli eventi pubblici collegati ai POI. Il report è distinto dall'heatmap perché ha una finalità di attivazione."
          icon={CalendarDays}
        >
          <ViewStatus error={snapshot.errors.events} count={snapshot.eventAttendance.length} />
        </SectionHeader>
        <DataMessage error={snapshot.errors.events} empty={snapshot.eventAttendance.length === 0}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <CalendarDays className="h-4 w-4 text-violet-500" />
                Eventi con attribuzione
              </div>
              <span className="text-xs font-semibold text-slate-500">Dati aggregati per evento</span>
            </div>
            <EventAttendanceTable rows={snapshot.eventAttendance} />
          </div>
        </DataMessage>
      </section>

      <section className="space-y-5">
        <SectionHeader
          id="telemetry"
          eyebrow="Sviluppo · Non vendibile"
          title="Telemetria tecnica"
          description="Eventi tecnici per il debug dell'app. Questi dati non fanno parte del prodotto DaaS commerciale e restano separati dai report ESG."
          icon={Activity}
        >
          <ViewStatus error={snapshot.errors.telemetry} count={snapshot.telemetryDaily.length} />
        </SectionHeader>
        <DataMessage error={snapshot.errors.telemetry} empty={snapshot.telemetryDaily.length === 0}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Activity className="h-4 w-4 text-slate-500" />
                Eventi tecnici aggregati
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />
                {formatInteger(totalTelemetryEvents)} eventi
              </span>
            </div>
            <TelemetryTable rows={snapshot.telemetryDaily} />
          </div>
        </DataMessage>
      </section>

      <footer className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Report read-only · zero-PII · aggregazione server-side</span>
        </div>
        <span>Per l’esportazione commerciale servono grant e RLS dedicati.</span>
      </footer>
    </div>
  )
}
