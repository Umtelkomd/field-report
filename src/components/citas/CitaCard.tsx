import { MapPin, Clock, ExternalLink } from 'lucide-react'
import { CITA_STATUS_DONE, CITA_STATUS_LABELS } from '../../types'
import type { Cita } from '../../types'

const STATUS_STYLES: Record<string, string> = {
  libre: 'bg-gray-100 text-gray-500',
  asignada: 'bg-blue-50 text-blue-600',
  capturada: 'bg-indigo-50 text-indigo-600',
  en_trabajo: 'bg-amber-50 text-amber-600',
  finalizada_ok: 'bg-brand-50 text-brand-600',
  finalizada_no_ok: 'bg-red-50 text-red-600',
  cliente_ausente: 'bg-orange-50 text-orange-600',
  recitar: 'bg-orange-50 text-orange-600',
  paralizada: 'bg-gray-100 text-gray-500',
}

interface Props {
  cita: Cita
  onCapture: (id: string) => void
  onStart: (cita: Cita) => void
  onFinish: (cita: Cita) => void
}

export function CitaCard({ cita, onCapture, onStart, onFinish }: Props) {
  const isDone = CITA_STATUS_DONE.includes(cita.status)
  const statusLabel = CITA_STATUS_LABELS[cita.status] || cita.status
  const statusStyle = STATUS_STYLES[cita.status] || 'bg-gray-100 text-gray-500'

  const address = cita.calle
    ? `${cita.calle}, ${cita.cp} ${cita.ciudad}`.trim()
    : cita.ciudad || '—'

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <span className="text-[16px] font-extrabold text-gray-900">{cita.ha || '—'}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusStyle}`}>
          {statusLabel}
        </span>
      </div>

      {/* Details */}
      <div className="mb-3 flex flex-col gap-1">
        <p className="flex items-center gap-1.5 text-[13px] text-gray-400">
          <MapPin size={13} className="shrink-0" /> {address}
        </p>
        <p className="flex items-center gap-1.5 text-[12px] text-gray-300">
          <Clock size={12} className="shrink-0" />
          {cita.inicio} – {cita.fin} &middot; {cita.tecnicos} TK
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isDone && (cita.status === 'libre' || cita.status === 'asignada') && (
          <button
            type="button"
            onClick={() => onCapture(cita.id)}
            className="flex-1 rounded-xl bg-brand-500 py-2.5 text-[13px] font-bold text-white active:bg-brand-600"
          >
            Capturar
          </button>
        )}
        {!isDone && cita.status === 'capturada' && (
          <button
            type="button"
            onClick={() => onStart(cita)}
            className="flex-1 rounded-xl bg-brand-500 py-2.5 text-[13px] font-bold text-white active:bg-brand-600"
          >
            Iniciar trabajo
          </button>
        )}
        {!isDone && cita.status === 'en_trabajo' && (
          <button
            type="button"
            onClick={() => onFinish(cita)}
            className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-[13px] font-bold text-white active:bg-indigo-600"
          >
            Finalizar
          </button>
        )}
        {cita.linkDocs && (
          <a
            href={cita.linkDocs}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-xl border border-gray-100 px-3 py-2.5 text-[13px] font-semibold text-gray-500"
          >
            <ExternalLink size={14} /> Docs
          </a>
        )}
      </div>
    </div>
  )
}
