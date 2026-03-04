import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { useTranslation } from '../../hooks/useTranslation'
import { WC_BASEMENT, WC_WE_PHOTOS, WC_EXTERIOR } from '../../data/wcPhotos'
import { NE4_CHECKS, CATEGORY_COLORS } from '../../data/ne4Checklist'
import { PhotoField } from '../ui/PhotoField'
import { ValidationScoreCard } from './ValidationScoreCard'
import { IS_FINALIZED } from '../../types'
import type { WorkStatus } from '../../types'

const PROTOCOLS = [
  { id: 'prot_auskundung', titleKey: 'protAusk', descKey: 'protAuskDesc' },
  { id: 'prot_installation', titleKey: 'protInst', descKey: 'protInstDesc' },
  { id: 'prot_mess', titleKey: 'protMess', descKey: 'protMessDesc' },
  { id: 'prot_farb', titleKey: 'protFarb', descKey: 'protFarbDesc' },
] as const

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

export function WcSection() {
  const { t } = useTranslation()
  const formData = useAppStore((s) => s.formData)
  const setFormField = useAppStore((s) => s.setFormField)
  const protocols = useAppStore((s) => s.protocols)
  const toggleProtocol = useAppStore((s) => s.toggleProtocol)
  const checkedItems = useAppStore((s) => s.checkedItems)
  const toggleChecked = useAppStore((s) => s.toggleChecked)
  const hasPhoto = useAppStore((s) => s.hasPhoto)

  const isFinalized = IS_FINALIZED.includes(formData.workStatus as WorkStatus)
  const numWe = parseInt(formData.units || '0') || 0
  const [activeWe, setActiveWe] = useState(1)

  const haFormatOk = /^HA\d+$/i.test(formData.ha || '')

  const photos = useAppStore((s) => s.photos)
  const basementFilled = useMemo(
    () => WC_BASEMENT.filter((p) => p.required && !!photos[p.id]?.length).length,
    [photos]
  )
  const basementReq = WC_BASEMENT.filter((p) => p.required).length

  const exteriorFilled = useMemo(
    () => WC_EXTERIOR.filter((p) => p.required && !!photos[p.id]?.length).length,
    [photos]
  )
  const exteriorReq = WC_EXTERIOR.filter((p) => p.required).length

  const checklistChecked = NE4_CHECKS.filter((c) => checkedItems.includes(c.id)).length

  return (
    <>
      {/* HA Data */}
      <section className="section-card">
        <h3 className="mb-4 text-[15px] font-extrabold text-gray-900">{t('wcData')}</h3>
        <div className="mb-3">
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-gray-400">
            {t('lblHA')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.ha || ''}
            onChange={(e) => setFormField('ha', e.target.value)}
            placeholder="Ej: HA898706"
            className="input-field"
          />
          {formData.ha && !haFormatOk && (
            <p className="mt-1.5 text-[11px] font-medium text-amber-500">{t('valHaFormatHint')}</p>
          )}
        </div>
        <div className="mb-3">
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-gray-400">
            {t('lblUnits')} <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={formData.units || ''}
            onChange={(e) => setFormField('units', e.target.value)}
            placeholder="WE"
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-gray-400">
            {t('lblVariant')} <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.variant || ''}
            onChange={(e) => setFormField('variant', e.target.value)}
            className="input-field"
          >
            <option value="">{t('selectOpt')}</option>
            <option value="empty-pipes">{t('varEmpty')}</option>
            <option value="interior-riser">{t('varInterior')}</option>
            <option value="corridor-riser">{t('varCorridor')}</option>
            <option value="exterior-riser">{t('varExterior')}</option>
          </select>
        </div>
      </section>

      {/* Protocols */}
      {isFinalized && (
        <section className="section-card">
          <h3 className="mb-4 text-[15px] font-extrabold text-gray-900">{t('protocols')}</h3>
          <div className="flex flex-col gap-2">
            {PROTOCOLS.map((p) => (
              <label
                key={p.id}
                className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${
                  protocols.includes(p.id) ? 'bg-brand-50' : 'bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={protocols.includes(p.id)}
                  onChange={() => toggleProtocol(p.id)}
                  className="mt-0.5 h-5 w-5 rounded-md accent-brand-500"
                />
                <div>
                  <div className="text-[13px] font-semibold text-gray-800">{t(p.titleKey)}</div>
                  <div className="text-[11px] text-gray-400">{t(p.descKey)}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-4">
            {PROTOCOLS.map((p, i) => (
              <PhotoField
                key={p.id}
                fieldId={`protocol_${i}`}
                label={`${t(p.titleKey)} (foto/PDF)`}
                required
              />
            ))}
          </div>
        </section>
      )}

      {/* NE4 Checklist */}
      {isFinalized && (
        <section className="section-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-extrabold text-gray-900">{t('checklistTitle')}</h3>
            <CountBadge filled={checklistChecked} total={NE4_CHECKS.length} />
          </div>
          <div className="flex flex-col gap-1.5">
            {NE4_CHECKS.map((item) => {
              const colors = CATEGORY_COLORS[item.category]
              const checked = checkedItems.includes(item.id)
              return (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 rounded-xl border-l-[3px] p-3 transition-colors ${colors.border} ${
                    checked ? colors.bg : 'bg-gray-50/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleChecked(item.id)}
                    className="mt-0.5 h-5 w-5 rounded-md accent-brand-500"
                  />
                  <div>
                    <div className="text-[13px] font-semibold text-gray-800">{t(item.titleKey)}</div>
                    <div className="text-[11px] text-gray-400">{t(item.descKey)}</div>
                  </div>
                </label>
              )
            })}
          </div>
        </section>
      )}

      {/* Basement Photos */}
      {isFinalized && (
        <section className="section-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-extrabold text-gray-900">{t('fotosSotano')}</h3>
            <CountBadge filled={basementFilled} total={basementReq} />
          </div>
          {WC_BASEMENT.map((p) => (
            <PhotoField key={p.id} fieldId={p.id} label={p.label} required={p.required} />
          ))}
        </section>
      )}

      {/* Per-WE Photos */}
      {isFinalized && numWe > 0 && (
        <section className="section-card">
          <h3 className="mb-3 text-[15px] font-extrabold text-gray-900">
            {t('fotosVivienda')} ({numWe} WE)
          </h3>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {Array.from({ length: numWe }, (_, i) => i + 1).map((n) => {
              const weId = 'we' + String(n).padStart(2, '0')
              const reqPhotos = WC_WE_PHOTOS.filter((p) => p.required)
              const weFilled = reqPhotos.filter((p) => hasPhoto(`${weId}_${p.suffix}`)).length
              const complete = weFilled === reqPhotos.length
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setActiveWe(n)}
                  className={`rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all ${
                    n === activeWe
                      ? 'bg-brand-500 text-white shadow-glow'
                      : complete
                        ? 'bg-brand-50 text-brand-600'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  WE-{String(n).padStart(2, '0')}
                </button>
              )
            })}
          </div>
          {Array.from({ length: numWe }, (_, i) => i + 1).map((n) => {
            if (n !== activeWe) return null
            const weId = 'we' + String(n).padStart(2, '0')
            return (
              <div key={n} className="animate-fade-in">
                <p className="mb-3 text-[13px] font-bold text-gray-700">
                  WE-{String(n).padStart(2, '0')}
                </p>
                {WC_WE_PHOTOS.map((p) => (
                  <PhotoField
                    key={p.suffix}
                    fieldId={`${weId}_${p.suffix}`}
                    label={p.label}
                    required={p.required}
                  />
                ))}
              </div>
            )
          })}
        </section>
      )}

      {/* Exterior Photos */}
      {isFinalized && (
        <section className="section-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-extrabold text-gray-900">{t('fotosExterior')}</h3>
            <CountBadge filled={exteriorFilled} total={exteriorReq} />
          </div>
          {WC_EXTERIOR.map((p) => (
            <PhotoField key={p.id} fieldId={p.id} label={p.label} required={p.required} />
          ))}
        </section>
      )}

      {/* Validation Score Card */}
      {isFinalized && <ValidationScoreCard />}
    </>
  )
}
