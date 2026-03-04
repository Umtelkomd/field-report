import { useMemo } from 'react'
import { Clock, ImageIcon } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useTranslation } from '../../hooks/useTranslation'
import { STATUS_MAP } from '../../types'

export function HistoryView() {
  const { t } = useTranslation()
  const submissions = useAppStore((s) => s.submissions)
  const setView = useAppStore((s) => s.setView)

  const today = new Date().toISOString().split('T')[0]

  const todaySubmissions = useMemo(
    () =>
      submissions
        .filter((s) => s.date === today || s.timestamp.startsWith(today))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [submissions, today]
  )

  return (
    <div className="animate-fade-in mx-auto max-w-lg p-4">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-900">{t('histTitle')}</h2>
        <button
          type="button"
          onClick={() => setView('form')}
          className="text-[13px] font-bold text-brand-500"
        >
          {t('histBack')}
        </button>
      </div>

      {todaySubmissions.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-card">
          <div className="mb-2 text-4xl">📋</div>
          <p className="text-[13px] text-gray-400">{t('histEmpty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {todaySubmissions.map((sub, i) => {
            const statusInfo = STATUS_MAP[sub.workStatus] || {
              label: sub.workStatus,
              color: '#999',
            }
            const time = sub.timestamp.split('T')[1]?.substring(0, 5) || ''
            const photoCount = Object.values(sub.photos || {}).reduce(
              (acc, arr) => acc + arr.length,
              0
            )
            const id = sub.ha || sub.orderNumber || ''

            return (
              <div
                key={sub.timestamp + i}
                className="rounded-2xl bg-white p-4 shadow-card"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[15px] font-bold text-gray-900">
                    {id || (sub.client === 'westconnect' ? 'WC' : 'GFP')}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: statusInfo.color }}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {time}
                  </span>
                  <span>{sub.startTime}–{sub.endTime}</span>
                  <span className="flex items-center gap-1">
                    <ImageIcon size={12} /> {photoCount}
                  </span>
                  {sub.pendingSync && (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                      Pendiente
                    </span>
                  )}
                  {sub.validation_score !== undefined && (
                    <span className="font-bold text-brand-500">{sub.validation_score}%</span>
                  )}
                </div>
                {sub.comments && (
                  <p className="mt-2 text-[12px] text-gray-300 line-clamp-2">{sub.comments}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
