import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchReports, fetchCitasJson, assignCita, formatDuration } from '../../lib/api'
import { useAppStore } from '../../store/appStore'
import { STATUS_MAP, CITA_STATUS_DONE, CITA_STATUS_LABELS } from '../../types'
import type { Report, Cita } from '../../types'

type Tab = 'overview' | 'citas' | 'reports' | 'teams'
type Period = 'today' | 'week' | 'month' | 'all' | 'custom'

export function AdminView() {
  const teamConfigs = useAppStore((s) => s.teamConfigs)
  const addToast = useAppStore((s) => s.addToast)

  const [tab, setTab] = useState<Tab>('overview')
  const [allData, setAllData] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [period, setPeriod] = useState<Period>('week')
  const [filterClient, setFilterClient] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Citas
  const [citas, setCitas] = useState<Cita[]>([])
  const [citasDate, setCitasDate] = useState('')
  const [citasLoading, setCitasLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const reports = await fetchReports()
        setAllData(reports)
      } catch (e) {
        console.error('Load error:', e)
        addToast('Error cargando datos', 'error')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [addToast])

  const teams = useMemo(
    () => [...new Set(allData.map((r) => r.team).filter(Boolean))].sort(),
    [allData]
  )

  const filtered = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    return allData
      .filter((r) => {
        if (filterClient && r.client !== filterClient) return false
        if (filterTeam && r.team !== filterTeam) return false
        if (filterStatus && r.workStatus !== filterStatus) return false

        if (period === 'today') return r.date === today
        if (period === 'week') {
          const d = new Date(r.date + 'T12:00:00')
          const mon = new Date(now)
          mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
          mon.setHours(0, 0, 0, 0)
          const sun = new Date(mon)
          sun.setDate(mon.getDate() + 6)
          sun.setHours(23, 59, 59, 999)
          return d >= mon && d <= sun
        }
        if (period === 'month') return r.date.startsWith(today.substring(0, 7))
        if (period === 'custom') {
          if (customFrom && r.date < customFrom) return false
          if (customTo && r.date > customTo) return false
        }
        return true
      })
      .sort((a, b) => (b.timestamp || b.date).localeCompare(a.timestamp || a.date))
  }, [allData, period, filterClient, filterTeam, filterStatus, customFrom, customTo])

  // KPIs
  const kpis = useMemo(() => {
    const total = filtered.length
    const ok = filtered.filter((r) => r.workStatus === 'completed-ok').length
    const notOk = filtered.filter((r) => r.workStatus === 'completed-not-ok').length
    const absent = filtered.filter((r) => r.workStatus === 'client-absent').length
    const preinstalled = filtered.filter((r) => r.workStatus === 'preinstalled').length
    const avgDuration =
      total > 0
        ? Math.round(filtered.reduce((s, r) => s + (r.duration || 0), 0) / total)
        : 0
    const successRate = total > 0 ? Math.round(((ok + preinstalled) / total) * 100) : 0
    const uniqueDays = new Set(filtered.map((r) => r.date)).size
    const avgPerDay = uniqueDays > 0 ? (total / uniqueDays).toFixed(1) : '0'
    return { total, ok, notOk, absent, preinstalled, avgDuration, successRate, avgPerDay, uniqueDays }
  }, [filtered])

  // Charts data
  const dailyData = useMemo(() => {
    const byday: Record<string, number> = {}
    filtered.forEach((r) => {
      byday[r.date] = (byday[r.date] || 0) + 1
    })
    const days = Object.keys(byday).sort().slice(-7)
    const max = Math.max(...days.map((d) => byday[d]), 1)
    return days.map((d) => ({
      date: d,
      count: byday[d],
      pct: Math.round((byday[d] / max) * 100),
      label: new Date(d + 'T12:00:00').toLocaleDateString('es', {
        weekday: 'short',
        day: 'numeric',
      }),
    }))
  }, [filtered])

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach((r) => {
      const s = r.workStatus || 'unknown'
      counts[s] = (counts[s] || 0) + 1
    })
    const total = filtered.length || 1
    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      pct: Math.round((count / total) * 100),
      label: STATUS_MAP[status]?.label || status,
      color: STATUS_MAP[status]?.color || '#666',
    }))
  }, [filtered])

  const teamData = useMemo(() => {
    const byteam: Record<string, { total: number; ok: number; notOk: number; totalTime: number; techs: Record<string, { total: number; ok: number; notOk: number; totalTime: number }> }> = {}
    filtered.forEach((r) => {
      const t = r.team || 'Sin equipo'
      if (!byteam[t]) byteam[t] = { total: 0, ok: 0, notOk: 0, totalTime: 0, techs: {} }
      byteam[t].total++
      if (r.workStatus === 'completed-ok' || r.workStatus === 'preinstalled') byteam[t].ok++
      if (r.workStatus === 'completed-not-ok') byteam[t].notOk++
      byteam[t].totalTime += r.duration || 0
      const tech = r.technician?.trim() || `(${t})`
      if (!byteam[t].techs[tech])
        byteam[t].techs[tech] = { total: 0, ok: 0, notOk: 0, totalTime: 0 }
      byteam[t].techs[tech].total++
      if (r.workStatus === 'completed-ok' || r.workStatus === 'preinstalled')
        byteam[t].techs[tech].ok++
      if (r.workStatus === 'completed-not-ok') byteam[t].techs[tech].notOk++
      byteam[t].techs[tech].totalTime += r.duration || 0
    })
    return byteam
  }, [filtered])

  // Citas admin
  const loadCitas = useCallback(async (dateStr: string) => {
    setCitasLoading(true)
    try {
      const data = await fetchCitasJson()
      const today = new Date().toISOString().split('T')[0]
      const all = (data.citas || []).filter((c) => c.fecha >= today)
      setCitas(dateStr ? all.filter((c) => c.fecha === dateStr) : all)
    } catch {
      setCitas([])
      addToast('Error cargando citas', 'error')
    } finally {
      setCitasLoading(false)
    }
  }, [addToast])

  const handleAssign = async (cita: Cita, equipo: string, linkDocs: string) => {
    try {
      const result = await assignCita({
        citaId: cita.id,
        equipo,
        linkDocs,
        ha: cita.ha || '',
        direccion: cita.calle || '',
        cp: cita.cp || '',
        ciudad: cita.ciudad || '',
        inicio: cita.inicio || '',
        fin: cita.fin || '',
        tecnicos: String(cita.tecnicos || ''),
        fecha: cita.fecha || '',
      })
      if (result.success) {
        addToast('Cita asignada', 'success')
        void loadCitas(citasDate)
      } else {
        addToast(result.error || 'Error', 'error')
      }
    } catch (e) {
      addToast('Error asignando cita', 'error')
    }
  }

  const exportCSV = () => {
    const headers = [
      'Fecha',
      'Equipo',
      'Técnico',
      'Cliente',
      'Estado',
      'Orden/HA',
      'Inicio',
      'Fin',
      'Duración (min)',
      'Comentarios',
    ]
    const rows = filtered.map((r) => [
      r.date,
      r.team,
      r.technician,
      r.client,
      STATUS_MAP[r.workStatus]?.label || r.workStatus,
      r.orderNumber || r.ha || '',
      r.startTime,
      r.endTime,
      r.duration,
      `"${(r.comments || '').replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `field-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const wcTeams = teamConfigs.filter((t) => t.client === 'westconnect').map((t) => t.name)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">Cargando datos...</div>
    )
  }

  return (
    <div className="min-h-screen bg-admin-bg text-white">
      <div className="mx-auto max-w-4xl p-4">
        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-admin-card p-1">
          {(['overview', 'citas', 'reports', 'teams'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                if (t === 'citas') void loadCitas(citasDate)
              }}
              className={`flex-1 rounded-md py-2 text-[13px] font-semibold ${
                tab === t ? 'bg-brand-500 text-white' : 'text-gray-400'
              }`}
            >
              {t === 'overview' ? 'General' : t === 'citas' ? 'Citas' : t === 'reports' ? 'Reportes' : 'Equipos'}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-white"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="all">Todo</option>
            <option value="custom">Personalizado</option>
          </select>
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-white"
          >
            <option value="">Todos clientes</option>
            <option value="glasfaser-plus">GFP</option>
            <option value="westconnect">WC</option>
          </select>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-white"
          >
            <option value="">Todos equipos</option>
            {teams.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-white"
          >
            <option value="">Todos estados</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        {period === 'custom' && (
          <div className="mb-4 flex gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="flex-1 rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-white"
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="flex-1 rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-white"
            />
          </div>
        )}

        {/* Overview tab */}
        {tab === 'overview' && (
          <>
            {/* KPIs */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KpiCard value={kpis.total} label="Total Reportes" sub={`${kpis.avgPerDay}/día`} color="text-brand-500" />
              <KpiCard value={kpis.ok} label="Finalizadas OK" sub={`${kpis.preinstalled} preinstaladas`} color="text-brand-500" />
              <KpiCard value={kpis.absent} label="Ausentes" sub={`${kpis.notOk} No OK`} color="text-warning" />
              <KpiCard value={`${kpis.successRate}%`} label="Tasa de Éxito" sub="OK + Preinstaladas" color="text-blue-400" />
              <KpiCard value={formatDuration(kpis.avgDuration)} label="Duración Prom." sub={`${kpis.uniqueDays} días`} color="text-purple-400" />
            </div>

            {/* Daily chart */}
            <div className="mb-4 rounded-lg bg-admin-card p-4">
              <h3 className="mb-3 text-sm font-bold text-gray-300">Reportes por día</h3>
              {dailyData.length === 0 ? (
                <p className="text-center text-sm text-gray-500">Sin datos</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {dailyData.map((d) => (
                    <div key={d.date} className="flex items-center gap-3">
                      <span className="w-16 text-right text-[12px] text-gray-400">{d.label}</span>
                      <div className="flex-1 rounded-full bg-admin-bg">
                        <div
                          className="rounded-full bg-brand-500 py-1 text-center text-[11px] font-bold text-white"
                          style={{ width: `${Math.max(d.pct, 10)}%` }}
                        >
                          {d.count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status distribution */}
            <div className="mb-4 rounded-lg bg-admin-card p-4">
              <h3 className="mb-3 text-sm font-bold text-gray-300">Distribución por estado</h3>
              <div className="flex flex-col gap-2">
                {statusData.map((s) => (
                  <div key={s.status} className="flex items-center gap-3">
                    <span className="w-28 text-right text-[12px] text-gray-400">{s.label}</span>
                    <div className="flex-1 rounded-full bg-admin-bg">
                      <div
                        className="rounded-full py-1 text-center text-[11px] font-bold text-white"
                        style={{
                          width: `${Math.max(s.pct, 8)}%`,
                          backgroundColor: s.color,
                        }}
                      >
                        {s.count}
                      </div>
                    </div>
                    <span className="w-10 text-right text-[11px] text-gray-500">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Citas tab */}
        {tab === 'citas' && (
          <div>
            <div className="mb-3 flex gap-2">
              <input
                type="date"
                value={citasDate}
                onChange={(e) => {
                  setCitasDate(e.target.value)
                  void loadCitas(e.target.value)
                }}
                className="flex-1 rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-white"
              />
              <button
                onClick={() => void loadCitas(citasDate)}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Recargar
              </button>
            </div>
            {citasLoading ? (
              <p className="py-12 text-center text-sm text-gray-400">Cargando citas...</p>
            ) : citas.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">Sin citas</p>
            ) : (
              <CitasAdminList
                citas={citas}
                wcTeams={wcTeams}
                onAssign={handleAssign}
              />
            )}
          </div>
        )}

        {/* Reports tab */}
        {tab === 'reports' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-400">{filtered.length} reportes</span>
              <button
                onClick={exportCSV}
                className="rounded-lg bg-admin-card px-3 py-2 text-[13px] font-semibold text-brand-500"
              >
                CSV
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg bg-admin-card">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-admin-border text-[11px] uppercase text-gray-500">
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Equipo</th>
                    <th className="px-3 py-2">Técnico</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Orden/HA</th>
                    <th className="px-3 py-2">Duración</th>
                    <th className="px-3 py-2">Fotos</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((r, i) => {
                    const info = STATUS_MAP[r.workStatus] || { label: r.workStatus, color: '#999' }
                    return (
                      <tr key={i} className="border-b border-admin-border">
                        <td className="px-3 py-2 text-gray-300">{r.date}</td>
                        <td className="px-3 py-2 text-gray-300">{r.team || '—'}</td>
                        <td className="px-3 py-2 text-gray-300">{r.technician || '—'}</td>
                        <td className="px-3 py-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: info.color + '30', color: info.color }}
                          >
                            {info.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-gray-300">
                          {r.orderNumber || r.ha || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-400">{formatDuration(r.duration)}</td>
                        <td className="px-3 py-2 text-gray-400">{r.photoCount || 0}</td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                        Sin reportes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Teams tab */}
        {tab === 'teams' && (
          <div>
            {/* Team cards */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.entries(teamData)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([name, d]) => {
                  const rate = d.total > 0 ? Math.round((d.ok / d.total) * 100) : 0
                  return (
                    <div key={name} className="rounded-lg bg-admin-card p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-bold text-white">{name}</span>
                        <span className="text-2xl font-extrabold text-brand-500">{d.total}</span>
                      </div>
                      <p className="text-[12px] text-gray-400">
                        {d.ok} OK &middot; {d.notOk} No OK &middot; {rate}% éxito
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {formatDuration(d.total > 0 ? Math.round(d.totalTime / d.total) : 0)} prom &middot; {Object.keys(d.techs).length} técnicos
                      </p>
                    </div>
                  )
                })}
            </div>

            {/* Tech detail table */}
            <div className="overflow-x-auto rounded-lg bg-admin-card">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-admin-border text-[11px] uppercase text-gray-500">
                    <th className="px-3 py-2">Técnico</th>
                    <th className="px-3 py-2">Equipo</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">OK</th>
                    <th className="px-3 py-2">No OK</th>
                    <th className="px-3 py-2">Éxito</th>
                    <th className="px-3 py-2">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(teamData)
                    .flatMap(([team, d]) =>
                      Object.entries(d.techs).map(([tech, td]) => ({
                        tech,
                        team,
                        ...td,
                        avg: td.total > 0 ? Math.round(td.totalTime / td.total) : 0,
                        rate: td.total > 0 ? Math.round((td.ok / td.total) * 100) : 0,
                      }))
                    )
                    .sort((a, b) => b.total - a.total)
                    .map((t, i) => (
                      <tr key={i} className="border-b border-admin-border">
                        <td className="px-3 py-2 text-gray-300">{t.tech}</td>
                        <td className="px-3 py-2 text-gray-400">{t.team}</td>
                        <td className="px-3 py-2 font-bold text-white">{t.total}</td>
                        <td className="px-3 py-2 text-brand-500">{t.ok}</td>
                        <td className="px-3 py-2 text-red-400">{t.notOk}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              t.rate >= 80
                                ? 'bg-green-900/50 text-brand-500'
                                : t.rate >= 50
                                  ? 'bg-yellow-900/50 text-warning'
                                  : 'bg-red-900/50 text-red-400'
                            }`}
                          >
                            {t.rate}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-400">{formatDuration(t.avg)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Sub-components ---

function KpiCard({
  value,
  label,
  sub,
  color,
}: {
  value: string | number
  label: string
  sub: string
  color: string
}) {
  return (
    <div className="rounded-lg bg-admin-card p-3">
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="text-[12px] font-semibold text-gray-300">{label}</div>
      <div className="text-[11px] text-gray-500">{sub}</div>
    </div>
  )
}

function CitasAdminList({
  citas,
  wcTeams,
  onAssign,
}: {
  citas: Cita[]
  wcTeams: string[]
  onAssign: (cita: Cita, equipo: string, linkDocs: string) => void
}) {
  // Group by date
  const byDate: Record<string, Cita[]> = {}
  citas.forEach((c) => {
    if (!byDate[c.fecha]) byDate[c.fecha] = []
    byDate[c.fecha].push(c)
  })

  return (
    <div className="flex flex-col gap-6">
      {Object.keys(byDate)
        .sort()
        .map((fecha) => (
          <div key={fecha}>
            <h4 className="mb-2 border-b border-admin-border pb-1 text-[13px] font-bold uppercase tracking-wider text-blue-400">
              {new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}{' '}
              ({byDate[fecha].length})
            </h4>
            <div className="flex flex-col gap-2">
              {byDate[fecha].map((c) => (
                <AdminCitaCard key={c.id} cita={c} wcTeams={wcTeams} onAssign={onAssign} />
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}

function AdminCitaCard({
  cita,
  wcTeams,
  onAssign,
}: {
  cita: Cita
  wcTeams: string[]
  onAssign: (cita: Cita, equipo: string, linkDocs: string) => void
}) {
  const isDone = CITA_STATUS_DONE.includes(cita.status)
  const statusLabel = CITA_STATUS_LABELS[cita.status] || cita.status
  const [equipo, setEquipo] = useState(cita.equipo || '')
  const [linkDocs, setLinkDocs] = useState(cita.linkDocs || '')
  const [assigning, setAssigning] = useState(false)

  const addr = cita.calle
    ? `${cita.calle}, ${cita.cp} ${cita.ciudad}`.trim()
    : cita.ciudad || '—'

  const handleAssign = async () => {
    if (!equipo) return
    setAssigning(true)
    await onAssign(cita, equipo, linkDocs)
    setAssigning(false)
  }

  return (
    <div className="rounded-lg bg-admin-card p-3">
      <div className="mb-1 flex items-start justify-between">
        <span className="text-[16px] font-bold text-white">{cita.ha || '—'}</span>
        <span className="rounded-full bg-blue-900/50 px-2 py-0.5 text-[11px] font-semibold text-blue-300">
          {statusLabel}
        </span>
      </div>
      <p className="text-[13px] text-gray-400">{addr}</p>
      <p className="mb-2 text-[12px] text-blue-400">
        {cita.inicio} – {cita.fin} &middot; {cita.tecnicos} TK
      </p>
      {!isDone ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <select
              value={equipo}
              onChange={(e) => setEquipo(e.target.value)}
              className="flex-1 rounded-lg border border-admin-border bg-admin-bg px-2 py-1.5 text-sm text-white"
            >
              <option value="">— Equipo —</option>
              {wcTeams.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              onClick={() => void handleAssign()}
              disabled={!equipo || assigning}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              {assigning ? '...' : cita.equipo ? 'Actualizar' : 'Asignar'}
            </button>
          </div>
          <input
            type="url"
            value={linkDocs}
            onChange={(e) => setLinkDocs(e.target.value)}
            placeholder="Link Aushändigung (Drive)"
            className="rounded-lg border border-admin-border bg-admin-bg px-2 py-1.5 text-sm text-white placeholder:text-gray-600"
          />
        </div>
      ) : (
        <div className="text-[12px] text-gray-500">
          {cita.equipo && <span>{cita.equipo}</span>}
          {cita.linkDocs && (
            <a
              href={cita.linkDocs}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-400"
            >
              Docs
            </a>
          )}
        </div>
      )}
    </div>
  )
}
