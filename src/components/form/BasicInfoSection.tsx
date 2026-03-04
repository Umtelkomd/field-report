import { useAppStore } from '../../store/appStore'
import { useTranslation } from '../../hooks/useTranslation'
import type { WorkStatus } from '../../types'

export function BasicInfoSection() {
  const { t } = useTranslation()
  const currentTeam = useAppStore((s) => s.currentTeam)
  const currentTechnician = useAppStore((s) => s.currentTechnician)
  const formData = useAppStore((s) => s.formData)
  const setFormField = useAppStore((s) => s.setFormField)
  const teamConfigs = useAppStore((s) => s.teamConfigs)
  const needsEvidence = ['client-absent', 'client-reschedule'].includes(formData.workStatus || '')

  const supportTeams = teamConfigs.filter(
    (tc) => tc.client === currentTeam?.client && tc.name !== currentTeam?.name
  )

  const statuses: { value: WorkStatus; labelKey: string }[] = [
    { value: 'completed-ok', labelKey: 'statusFinalizado' },
    { value: 'client-reschedule', labelKey: 'statusSegundaCita' },
    { value: 'client-absent', labelKey: 'statusAbsent' },
  ]

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <h3 className="mb-4 text-[15px] font-extrabold text-gray-900">{t('sectionBasic')}</h3>

      {/* Client + Team + Tech (read-only row) */}
      <div className="mb-4 flex gap-2">
        <div className="flex-1 rounded-xl bg-gray-50 px-3 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('lblClient')}</div>
          <div className="text-[13px] font-semibold text-gray-700">
            {currentTeam?.client === 'glasfaser-plus' ? 'GFP' : 'WC'}
          </div>
        </div>
        <div className="flex-1 rounded-xl bg-gray-50 px-3 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('lblTeam')}</div>
          <div className="text-[13px] font-semibold text-gray-700">{currentTeam?.name || '—'}</div>
        </div>
        {currentTechnician && (
          <div className="flex-1 rounded-xl bg-gray-50 px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('lblTech')}</div>
            <div className="truncate text-[13px] font-semibold text-gray-700">{currentTechnician}</div>
          </div>
        )}
      </div>

      {/* Support team */}
      <FormField label={t('lblSupport')}>
        <select
          value={formData.supportTeam || ''}
          onChange={(e) => setFormField('supportTeam', e.target.value)}
          className="input-field"
        >
          <option value="">{t('noSupport')}</option>
          {supportTeams.map((st) => (
            <option key={st.name} value={st.name}>
              {st.name}{st.members.length > 0 ? ` — ${st.members.join(', ')}` : ''}
            </option>
          ))}
        </select>
      </FormField>

      {/* Date */}
      <FormField label={t('lblDate')} required>
        <input
          type="date"
          value={formData.date || ''}
          onChange={(e) => setFormField('date', e.target.value)}
          className="input-field"
        />
      </FormField>

      {/* Time */}
      <FormField label={t('lblSchedule')} required>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('lblStart')}</div>
            <input
              type="time"
              value={formData.startTime || ''}
              onChange={(e) => setFormField('startTime', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('lblEnd')}</div>
            <input
              type="time"
              value={formData.endTime || ''}
              onChange={(e) => setFormField('endTime', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </FormField>

      {/* Status */}
      <FormField label={t('lblStatus')} required>
        <select
          value={formData.workStatus || ''}
          onChange={(e) => setFormField('workStatus', e.target.value)}
          className="input-field"
        >
          <option value="">{t('selectStatus')}</option>
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {t(s.labelKey as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
      </FormField>

      {/* Comments */}
      <FormField label={t('lblComments')} required={needsEvidence}>
        <textarea
          value={formData.comments || ''}
          onChange={(e) => setFormField('comments', e.target.value)}
          placeholder={t('phComments')}
          className="input-field min-h-[80px] resize-y"
        />
      </FormField>
    </section>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-gray-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}
