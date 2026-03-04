import { useMemo } from 'react'
import { useAppStore } from '../../store/appStore'
import { useTranslation } from '../../hooks/useTranslation'
import { computeValidationScore } from '../../lib/validation'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export function ValidationScoreCard() {
  const { t, lang } = useTranslation()
  const formData = useAppStore((s) => s.formData)
  const photos = useAppStore((s) => s.photos)
  const photoQuality = useAppStore((s) => s.photoQuality)
  const checkedItems = useAppStore((s) => s.checkedItems)
  const protocols = useAppStore((s) => s.protocols)

  const result = useMemo(
    () =>
      computeValidationScore({
        ha: formData.ha || '',
        startTime: formData.startTime || '',
        endTime: formData.endTime || '',
        date: formData.date || '',
        units: formData.units || '',
        variant: formData.variant || '',
        comments: formData.comments || '',
        visitType: formData.visitType || 'primera',
        workStatus: formData.workStatus || '',
        apExists: formData.apExists !== 'false',
        photos,
        photoQuality,
        checkedItems,
        protocols,
        lang,
      }),
    [formData, photos, photoQuality, checkedItems, protocols, lang]
  )

  const scoreColor =
    result.score >= 90
      ? 'text-brand-500'
      : result.score >= 70
        ? 'text-amber-500'
        : 'text-red-500'

  const ringColor =
    result.score >= 90
      ? 'stroke-brand-500'
      : result.score >= 70
        ? 'stroke-amber-500'
        : 'stroke-red-500'

  const circumference = 2 * Math.PI * 40
  const offset = circumference - (circumference * result.score) / 100

  return (
    <section className="section-card">
      <h3 className="mb-4 text-[15px] font-extrabold text-gray-900">{t('valTitle')}</h3>

      {/* Score ring */}
      <div className="mb-5 flex items-center justify-center">
        <div className="relative h-28 w-28">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" strokeWidth="6" className="stroke-gray-100" />
            <circle
              cx="50" cy="50" r="40" fill="none" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`transition-all duration-700 ${ringColor}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${scoreColor}`}>{result.score}</span>
            <span className="text-[10px] font-bold text-gray-300">/ 100</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2">
        {result.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
            {item.ok ? (
              <CheckCircle2 size={16} className="shrink-0 text-brand-500" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-amber-400" />
            )}
            <div className="flex-1">
              <div className="text-[12px] font-semibold text-gray-700">{item.label}</div>
            </div>
            <span className={`text-[11px] font-bold ${item.ok ? 'text-brand-500' : 'text-amber-500'}`}>
              {item.ok ? 'OK' : item.detail.replace(/[✅⚠️❌]\s*/g, '')}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
