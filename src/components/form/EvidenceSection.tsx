import { useTranslation } from '../../hooks/useTranslation'
import { PhotoField } from '../ui/PhotoField'

export function EvidenceSection() {
  const { t } = useTranslation()

  return (
    <section className="section-card border border-amber-100 bg-amber-50/30">
      <h3 className="mb-1 text-[15px] font-extrabold text-gray-900">{t('evidenceTitle')}</h3>
      <p className="mb-4 text-[12px] text-gray-400">{t('evidenceHint')}</p>
      <PhotoField fieldId="evidence_1" label={t('evidencePhoto')} required />
      <PhotoField fieldId="evidence_2" label={t('evidenceExtra')} required={false} />
    </section>
  )
}
