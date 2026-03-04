import { User } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useTranslation } from '../../hooks/useTranslation'

export function MemberSelect() {
  const { t } = useTranslation()
  const currentTeam = useAppStore((s) => s.currentTeam)
  const clientType = useAppStore((s) => s.clientType)
  const setCurrentTechnician = useAppStore((s) => s.setCurrentTechnician)
  const setView = useAppStore((s) => s.setView)
  const resetForm = useAppStore((s) => s.resetForm)
  const setFormField = useAppStore((s) => s.setFormField)

  if (!currentTeam) return null

  const handleSelect = (name: string) => {
    setCurrentTechnician(name)
    resetForm()
    setFormField('date', new Date().toISOString().split('T')[0])
    setView(clientType === 'westconnect' ? 'citas' : 'form')
  }

  const isWc = clientType === 'westconnect'

  return (
    <div className="animate-fade-in flex flex-col items-center px-6 pt-14">
      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
        isWc ? 'bg-indigo-50' : 'bg-brand-50'
      }`}>
        <span className="text-3xl">{isWc ? '🔧' : '🔌'}</span>
      </div>
      <div className={`mb-1 rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
        isWc ? 'bg-indigo-50 text-indigo-600' : 'bg-brand-50 text-brand-600'
      }`}>
        {isWc ? 'Westconnect' : 'Glasfaser Plus'}
      </div>
      <h2 className="mb-1 text-xl font-extrabold text-gray-900">{currentTeam.name}</h2>
      <p className="mb-8 text-[13px] text-gray-400">{t('selectMember')}</p>

      <div className="flex w-full max-w-sm flex-col gap-2.5">
        {currentTeam.members.map((name) => (
          <button
            key={name}
            onClick={() => handleSelect(name)}
            className="group flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left shadow-card transition-all active:scale-[0.98] active:shadow-none"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 group-active:bg-brand-50 group-active:text-brand-500">
              <User size={18} />
            </div>
            <span className="text-[15px] font-semibold text-gray-800">{name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
