import { useMemo } from 'react'
import { useAppStore } from '../../store/appStore'
import { useTranslation } from '../../hooks/useTranslation'
import { getGfpRequiredPhotos } from '../../data/gfpPhotos'
import { PhotoField } from '../ui/PhotoField'
import { IS_FINALIZED } from '../../types'
import type { WorkStatus } from '../../types'

export function GfpSection() {
  const { t } = useTranslation()
  const formData = useAppStore((s) => s.formData)
  const setFormField = useAppStore((s) => s.setFormField)
  const hasPhoto = useAppStore((s) => s.hasPhoto)

  const bt = formData.buildingType || ''
  const isFinalized = IS_FINALIZED.includes(formData.workStatus as WorkStatus)
  const photos = useMemo(() => (bt && isFinalized ? getGfpRequiredPhotos(bt) : []), [bt, isFinalized])
  const filled = photos.filter((p) => hasPhoto(p.id)).length

  return (
    <>
      <section className="section-card">
        <h3 className="mb-4 text-[15px] font-extrabold text-gray-900">{t('gfpData')}</h3>
        <div className="mb-3">
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-gray-400">
            {t('lblOrder')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.orderNumber || ''}
            onChange={(e) => setFormField('orderNumber', e.target.value)}
            placeholder="Ej: 2051504"
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-gray-400">
            {t('lblBuildType')} <span className="text-red-400">*</span>
          </label>
          <select
            value={bt}
            onChange={(e) => setFormField('buildingType', e.target.value)}
            className="input-field"
          >
            <option value="">{t('selectOpt')}</option>
            <option value="sdu1-ap-ta">{t('sdu1simple')}</option>
            <option value="sdu1-ap+ta">{t('sdu1apTa')}</option>
            <option value="sdu2">{t('sdu2')}</option>
            <option value="mdu3">{t('mdu3')}</option>
          </select>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="section-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-extrabold text-gray-900">{t('gfpPhotos')}</h3>
            <CountBadge filled={filled} total={photos.length} />
          </div>
          {photos.map((p) => (
            <PhotoField key={p.id} fieldId={p.id} label={p.label} required={p.required} />
          ))}
        </section>
      )}
    </>
  )
}

function CountBadge({ filled, total }: { filled: number; total: number }) {
  const done = filled === total
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
      done ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'
    }`}>
      {filled}/{total}
    </span>
  )
}
