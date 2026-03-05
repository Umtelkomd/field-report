import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchReports, fetchCitasJson, assignCita, formatDuration } from '../../lib/api'
import { useAppStore } from '../../store/appStore'
import { STATUS_MAP, CITA_STATUS_LABELS } from '../../types'
import type { Report, Cita } from '../../types'

type Tab = 'calendar' | 'reports' | 'teams'
type CalView = 'day' | 'week'

const TEAMS = ['West-001', 'West-002', 'West-003', 'West-004']

const CITA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  libre: { bg: '#e5e7eb', text: '#6b7280', border: '#d1d5db' },
  asignada: { bg: '#dbeafe', text: '#2563eb', border: '#93c5fd' },
  capturada: { bg: '#fed7aa', text: '#c2410c', border: '#fdba74' },
  en_trabajo: { bg: '#fef08a', text: '#a16207', border: '#fde047' },
  finalizada_ok: { bg: '#bbf7d0', text: '#15803d', border: '#86efac' },
  finalizada_no_ok: { bg: '#fecaca', text: '#dc2626', border: '#fca5a5' },
  cliente_ausente: { bg: '#fde68a', text: '#92400e', border: '#fcd34d' },
  recitar: { bg: '#e9d5ff', text: '#7c3aed', border: '#c4b5fd' },
  paralizada: { bg: '#d1d5db', text: '#4b5563', border: '#9ca3af' },
}

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d)
  mon.setDate(diff)
  mon.setHours(0, 0, 0, 0)
  return mon
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function AdminView() {
  const teamConfigs = useAppStore((s) => s.teamConfigs)
  const addToast = useAppStore((s) => s.addToast)

  const [tab, setTab] = useState<Tab>('calendar')
  const [allReports, setAllReports] = useState<Report[]>([])
  const [loadingReports, setLoadingReports] = useState(true)

  // Calendar state
  const [calView, setCalView] = useState<CalView>('week')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [allCitas, setAllCitas] = useState<Cita[]>([])
  const [citasLoading, setCitasLoading] = useState(true)
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null)

  // Drag state
  const [dragCita, setDragCita] = useState<Cita | null>(null)

  const wcTeams = useMemo(
    () => teamConfigs.map((t) => t.name).filter((n) => n.startsWith('West-')),
    [teamConfigs]
  )
  const displayTeams = wcTeams.length > 0 ? wcTeams : TEAMS

  // Load citas
  const loadCitas = useCallback(async () => {
    setCitasLoading(true)
    try {
      const data = await fetchCitasJson()
      setAllCitas(data.citas || [])
    } catch {
      addToast('Error cargando citas', 'error')
    } finally {
      setCitasLoading(false)
    }
  }, [addToast])

  // Load reports
  useEffect(() => {
    async function load() {
      try {
        const reports = await fetchReports()
        setAllReports(reports)
      } catch {
        addToast('Error cargando datos', 'error')
      } finally {
        setLoadingReports(false)
      }
    }
    void load()
    void loadCitas()
  }, [addToast, loadCitas])

  // Date range for calendar
  const dateRange = useMemo(() => {
    if (calView === 'day') return [new Date(currentDate)]
    const mon = getMonday(currentDate)
    return Array.from({ length: 6 }, (_, i) => addDays(mon, i)) // Mon-Sat
  }, [calView, currentDate])

  const dateStrings = useMemo(() => dateRange.map(formatDate), [dateRange])

  // Citas in current range, grouped by team+date
  const citasByTeamDate = useMemo(() => {
    const map: Record<string, Cita[]> = {}
    allCitas
      .filter((c) => dateStrings.includes(c.fecha))
      .forEach((c) => {
        const team = c.equipo || '_unassigned'
        const key = `${team}|${c.fecha}`
        if (!map[key]) map[key] = []
        map[key].push(c)
      })
    return map
  }, [allCitas, dateStrings])

  // Unassigned citas
  const unassigned = useMemo(
    () => allCitas.filter((c) => !c.equipo && dateStrings.includes(c.fecha)),
    [allCitas, dateStrings]
  )

  // Navigation
  const navigateDate = (dir: number) => {
    const days = calView === 'day' ? 1 : 7
    setCurrentDate((d) => addDays(d, dir * days))
  }

  const goToday = () => setCurrentDate(new Date())

  // Assign via drag
  const handleAssignDrop = async (cita: Cita, team: string, date: string) => {
    try {
      const result = await assignCita({
        citaId: cita.id,
        equipo: team,
        linkDocs: cita.linkDocs || '',
        ha: cita.ha || '',
        direccion: cita.calle || '',
        cp: cita.cp || '',
        ciudad: cita.ciudad || '',
        inicio: cita.inicio || '',
        fin: cita.fin || '',
        tecnicos: String(cita.tecnicos || ''),
        fecha: date,
      })
      if (result.success) {
        addToast(`${cita.ha} asignada a ${team}`, 'success')
        void loadCitas()
      } else {
        addToast(result.error || 'Error', 'error')
      }
    } catch {
      addToast('Error asignando cita', 'error')
    }
  }

  // Assign from detail panel
  const handleAssignFromPanel = async (cita: Cita, equipo: string, linkDocs: string) => {
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
        setSelectedCita(null)
        void loadCitas()
      } else {
        addToast(result.error || 'Error', 'error')
      }
    } catch {
      addToast('Error asignando cita', 'error')
    }
  }

  // Reports filtering
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filteredReports = useMemo(() => {
    return allReports
      .filter((r) => {
        if (filterTeam && r.team !== filterTeam) return false
        if (filterStatus && r.workStatus !== filterStatus) return false
        return true
      })
      .sort((a, b) => (b.timestamp || b.date).localeCompare(a.timestamp || a.date))
      .slice(0, 100)
  }, [allReports, filterTeam, filterStatus])

  // Team stats
  const teamData = useMemo(() => {
    const byteam: Record<string, { total: number; ok: number; notOk: number; totalTime: number; techs: Set<string> }> = {}
    allReports.forEach((r) => {
      const t = r.team || 'Sin equipo'
      if (!byteam[t]) byteam[t] = { total: 0, ok: 0, notOk: 0, totalTime: 0, techs: new Set() }
      byteam[t].total++
      if (r.workStatus === 'completed-ok' || r.workStatus === 'preinstalled') byteam[t].ok++
      if (r.workStatus === 'completed-not-ok') byteam[t].notOk++
      byteam[t].totalTime += r.duration || 0
      if (r.technician) byteam[t].techs.add(r.technician)
    })
    return byteam
  }, [allReports])

  // CSV export
  const exportCSV = () => {
    const headers = ['Fecha', 'Equipo', 'Tecnico', 'Estado', 'HA', 'Inicio', 'Fin', 'Duracion (min)', 'Comentarios']
    const rows = filteredReports.map((r) => [
      r.date, r.team, r.technician,
      STATUS_MAP[r.workStatus]?.label || r.workStatus,
      r.ha || '', r.startTime, r.endTime, r.duration,
      `"${(r.comments || '').replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `field-report-${formatDate(new Date())}.csv`
    a.click()
  }

  const headerLabel = useMemo(() => {
    if (calView === 'day') {
      return currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    const start = dateRange[0]
    const end = dateRange[dateRange.length - 1]
    return `${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }, [calView, currentDate, dateRange])

  return (
    <div className="min-h-screen bg-admin-bg text-white">
      <div className="mx-auto max-w-6xl p-3 sm:p-4">
        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-admin-card p-1">
          {(['calendar', 'reports', 'teams'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md py-2 text-[13px] font-semibold ${
                tab === t ? 'bg-brand-500 text-white' : 'text-gray-400'
              }`}
            >
              {t === 'calendar' ? 'Calendario' : t === 'reports' ? 'Reportes' : 'Equipos'}
            </button>
          ))}
        </div>

        {/* Calendar tab */}
        {tab === 'calendar' && (
          <div className="flex flex-col gap-3">
            {/* Calendar header */}
            <div className="flex items-center justify-between rounded-lg bg-admin-card p-3">
              <div className="flex items-center gap-2">
                <button onClick={() => navigateDate(-1)} className="rounded-lg bg-admin-bg px-3 py-1.5 text-sm font-bold text-gray-300 hover:text-white">&lt;</button>
                <button onClick={goToday} className="rounded-lg bg-brand-500/20 px-3 py-1.5 text-[12px] font-bold text-brand-400">Hoy</button>
                <button onClick={() => navigateDate(1)} className="rounded-lg bg-admin-bg px-3 py-1.5 text-sm font-bold text-gray-300 hover:text-white">&gt;</button>
              </div>
              <span className="text-[13px] font-bold text-gray-300">{headerLabel}</span>
              <div className="flex rounded-lg bg-admin-bg p-0.5">
                <button
                  onClick={() => setCalView('day')}
                  className={`rounded-md px-3 py-1 text-[11px] font-bold ${calView === 'day' ? 'bg-brand-500 text-white' : 'text-gray-400'}`}
                >Dia</button>
                <button
                  onClick={() => setCalView('week')}
                  className={`rounded-md px-3 py-1 text-[11px] font-bold ${calView === 'week' ? 'bg-brand-500 text-white' : 'text-gray-400'}`}
                >Semana</button>
              </div>
            </div>

            {citasLoading ? (
              <div className="py-20 text-center text-gray-500">Cargando citas...</div>
            ) : (
              <div className="flex gap-3">
                {/* Main calendar grid */}
                <div className="flex-1 overflow-x-auto">
                  <div
                    className="grid min-w-[600px] gap-px rounded-lg bg-admin-border"
                    style={{
                      gridTemplateColumns: `100px repeat(${dateRange.length}, 1fr)`,
                      gridTemplateRows: `auto repeat(${displayTeams.length}, 1fr)`,
                    }}
                  >
                    {/* Header: empty corner + date columns */}
                    <div className="bg-admin-card p-2 text-[11px] font-bold text-gray-500 uppercase">Equipo</div>
                    {dateRange.map((d) => {
                      const isToday = formatDate(d) === formatDate(new Date())
                      return (
                        <div
                          key={formatDate(d)}
                          className={`bg-admin-card p-2 text-center ${isToday ? 'bg-brand-500/10' : ''}`}
                        >
                          <div className="text-[10px] font-bold uppercase text-gray-500">
                            {d.toLocaleDateString('es-ES', { weekday: 'short' })}
                          </div>
                          <div className={`text-[14px] font-bold ${isToday ? 'text-brand-400' : 'text-gray-300'}`}>
                            {d.getDate()}
                          </div>
                        </div>
                      )
                    })}

                    {/* Team rows */}
                    {displayTeams.map((team) => (
                      <>
                        {/* Team label */}
                        <div key={`label-${team}`} className="flex items-center bg-admin-card px-2 py-3">
                          <span className="text-[12px] font-bold text-gray-300">{team}</span>
                        </div>
                        {/* Date cells */}
                        {dateRange.map((d) => {
                          const dateStr = formatDate(d)
                          const key = `${team}|${dateStr}`
                          const citas = citasByTeamDate[key] || []
                          const isToday = dateStr === formatDate(new Date())
                          return (
                            <div
                              key={`${team}-${dateStr}`}
                              className={`min-h-[80px] bg-admin-card p-1 ${isToday ? 'bg-brand-500/5' : ''}`}
                              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                              onDrop={(e) => {
                                e.preventDefault()
                                if (dragCita) {
                                  void handleAssignDrop(dragCita, team, dateStr)
                                  setDragCita(null)
                                }
                              }}
                            >
                              {citas.map((c) => {
                                const colors = CITA_COLORS[c.status] || CITA_COLORS.libre
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    draggable
                                    onDragStart={() => setDragCita(c)}
                                    onClick={() => setSelectedCita(c)}
                                    className="mb-1 w-full cursor-pointer rounded-md px-1.5 py-1 text-left transition-all hover:scale-[1.02] hover:shadow-md"
                                    style={{
                                      backgroundColor: colors.bg,
                                      color: colors.text,
                                      borderLeft: `3px solid ${colors.border}`,
                                    }}
                                  >
                                    <div className="truncate text-[11px] font-bold">{c.ha || '—'}</div>
                                    <div className="truncate text-[9px] opacity-75">
                                      {c.inicio}–{c.fin} · {c.tecnicos}TK
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )
                        })}
                      </>
                    ))}
                  </div>
                </div>

                {/* Sidebar: unassigned or detail panel */}
                <div className="hidden w-72 shrink-0 flex-col gap-3 lg:flex">
                  {selectedCita ? (
                    <DetailPanel
                      cita={selectedCita}
                      teams={displayTeams}
                      onClose={() => setSelectedCita(null)}
                      onAssign={handleAssignFromPanel}
                    />
                  ) : (
                    <UnassignedSidebar
                      citas={unassigned}
                      onDragStart={setDragCita}
                      onSelect={setSelectedCita}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Mobile detail panel */}
            {selectedCita && (
              <div className="lg:hidden">
                <DetailPanel
                  cita={selectedCita}
                  teams={displayTeams}
                  onClose={() => setSelectedCita(null)}
                  onAssign={handleAssignFromPanel}
                />
              </div>
            )}

            {/* Mobile unassigned list */}
            {!selectedCita && unassigned.length > 0 && (
              <div className="lg:hidden">
                <UnassignedSidebar
                  citas={unassigned}
                  onDragStart={setDragCita}
                  onSelect={setSelectedCita}
                />
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-2 rounded-lg bg-admin-card p-3">
              {Object.entries(CITA_COLORS).map(([status, colors]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }} />
                  <span className="text-[10px] text-gray-400">{CITA_STATUS_LABELS[status] || status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports tab */}
        {tab === 'reports' && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="flex-1 rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-white"
              >
                <option value="">Todos equipos</option>
                {displayTeams.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-white"
              >
                <option value="">Todos estados</option>
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button
                onClick={exportCSV}
                className="rounded-lg bg-admin-card px-3 py-2 text-[13px] font-semibold text-brand-500"
              >
                CSV
              </button>
            </div>
            {loadingReports ? (
              <div className="py-20 text-center text-gray-500">Cargando...</div>
            ) : (
              <div className="overflow-x-auto rounded-lg bg-admin-card">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-admin-border text-[11px] uppercase text-gray-500">
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Equipo</th>
                      <th className="px-3 py-2">Tecnico</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">HA</th>
                      <th className="px-3 py-2">Duracion</th>
                      <th className="px-3 py-2">Fotos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((r, i) => {
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
                          <td className="px-3 py-2 font-mono text-gray-300">{r.ha || '—'}</td>
                          <td className="px-3 py-2 text-gray-400">{formatDuration(r.duration)}</td>
                          <td className="px-3 py-2 text-gray-400">{r.photoCount || 0}</td>
                        </tr>
                      )
                    })}
                    {filteredReports.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-gray-500">Sin reportes</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Teams tab */}
        {tab === 'teams' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                      {d.ok} OK &middot; {d.notOk} No OK &middot; {rate}% exito
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {formatDuration(d.total > 0 ? Math.round(d.totalTime / d.total) : 0)} prom &middot; {d.techs.size} tecnicos
                    </p>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Sub-components ---

function UnassignedSidebar({
  citas,
  onDragStart,
  onSelect,
}: {
  citas: Cita[]
  onDragStart: (c: Cita) => void
  onSelect: (c: Cita) => void
}) {
  return (
    <div className="rounded-lg bg-admin-card p-3">
      <h4 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-gray-500">
        Sin asignar ({citas.length})
      </h4>
      {citas.length === 0 ? (
        <p className="text-[12px] text-gray-600">Todas las citas estan asignadas</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          {citas.map((c) => (
            <div
              key={c.id}
              draggable
              onDragStart={() => onDragStart(c)}
              onClick={() => onSelect(c)}
              className="cursor-grab rounded-lg border border-admin-border bg-admin-bg p-2 transition-all hover:border-brand-500/50 active:cursor-grabbing"
            >
              <div className="text-[12px] font-bold text-white">{c.ha || '—'}</div>
              <div className="truncate text-[10px] text-gray-400">
                {c.calle ? `${c.calle}, ${c.ciudad}` : c.ciudad || '—'}
              </div>
              <div className="text-[10px] text-blue-400">
                {c.inicio}–{c.fin} · {c.tecnicos} TK
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DetailPanel({
  cita,
  teams,
  onClose,
  onAssign,
}: {
  cita: Cita
  teams: string[]
  onClose: () => void
  onAssign: (cita: Cita, equipo: string, linkDocs: string) => void
}) {
  const [equipo, setEquipo] = useState(cita.equipo || '')
  const [linkDocs, setLinkDocs] = useState(cita.linkDocs || '')
  const [assigning, setAssigning] = useState(false)

  const statusLabel = CITA_STATUS_LABELS[cita.status] || cita.status
  const colors = CITA_COLORS[cita.status] || CITA_COLORS.libre
  const address = cita.calle ? `${cita.calle}, ${cita.cp} ${cita.ciudad}` : cita.ciudad || '—'

  const handleAssign = async () => {
    if (!equipo) return
    setAssigning(true)
    onAssign(cita, equipo, linkDocs)
    setAssigning(false)
  }

  return (
    <div className="rounded-lg bg-admin-card p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="text-[16px] font-bold text-white">{cita.ha || '—'}</h4>
          <span
            className="inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {statusLabel}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-admin-bg text-gray-400 hover:text-white"
        >
          x
        </button>
      </div>

      <div className="mb-3 flex flex-col gap-1 text-[12px]">
        <p className="text-gray-400">{address}</p>
        <p className="text-blue-400">
          {cita.fecha} · {cita.inicio}–{cita.fin} · {cita.tecnicos} TK
        </p>
        {cita.equipo && <p className="text-gray-300">Equipo: {cita.equipo}</p>}
      </div>

      {cita.linkDocs && (
        <a
          href={cita.linkDocs}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 inline-block text-[12px] text-blue-400 underline"
        >
          Ver documentos
        </a>
      )}

      <div className="border-t border-admin-border pt-3">
        <label className="mb-1 block text-[11px] font-bold uppercase text-gray-500">Asignar equipo</label>
        <select
          value={equipo}
          onChange={(e) => setEquipo(e.target.value)}
          className="mb-2 w-full rounded-lg border border-admin-border bg-admin-bg px-2 py-1.5 text-sm text-white"
        >
          <option value="">— Equipo —</option>
          {teams.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          type="url"
          value={linkDocs}
          onChange={(e) => setLinkDocs(e.target.value)}
          placeholder="Link documentos (Drive)"
          className="mb-2 w-full rounded-lg border border-admin-border bg-admin-bg px-2 py-1.5 text-sm text-white placeholder:text-gray-600"
        />
        <button
          onClick={() => void handleAssign()}
          disabled={!equipo || assigning}
          className="w-full rounded-lg bg-brand-500 py-2 text-[13px] font-bold text-white disabled:opacity-50"
        >
          {assigning ? '...' : cita.equipo ? 'Actualizar' : 'Asignar'}
        </button>
      </div>
    </div>
  )
}
