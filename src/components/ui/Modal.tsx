import { useAppStore } from '../../store/appStore'
import { useTranslation } from '../../hooks/useTranslation'

export function Modal() {
  const { modal, closeModal } = useAppStore()
  const { t } = useTranslation()

  if (!modal.open) return null

  if (modal.type === 'success') {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="animate-scale-in mx-6 w-full max-w-xs rounded-3xl bg-white p-8 text-center shadow-elevated">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-extrabold text-gray-900">{t('successTitle')}</h3>
          <p className="mb-6 text-[13px] text-gray-400">{t('successMsg')}</p>
          <button
            onClick={closeModal}
            className="w-full rounded-xl bg-brand-500 px-4 py-3.5 text-[14px] font-bold text-white active:bg-brand-600"
          >
            {t('newForm')}
          </button>
        </div>
      </div>
    )
  }

  if (modal.type === 'scoreWarning') {
    const { score, onProceed } = modal.data as { score: number; onProceed: () => void }
    const msg = t('valLowScoreMsg').replace('{score}', String(score))

    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="animate-scale-in mx-6 w-full max-w-[340px] rounded-3xl bg-white p-8 text-center shadow-elevated">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <span className="text-3xl">
              {score < 70 ? '🔴' : '🟡'}
            </span>
          </div>
          <h3 className="mb-2 text-lg font-extrabold text-gray-900">
            {t('valLowScoreTitle')} ({score}%)
          </h3>
          <p className="mb-6 text-[13px] text-gray-400">{msg}</p>
          <div className="flex gap-3">
            <button
              onClick={closeModal}
              className="flex-1 rounded-xl bg-gray-100 px-4 py-3.5 text-[14px] font-bold text-gray-700 active:bg-gray-200"
            >
              {t('valGoBack')}
            </button>
            <button
              onClick={() => {
                closeModal()
                onProceed()
              }}
              className="flex-1 rounded-xl bg-amber-500 px-4 py-3.5 text-[14px] font-bold text-white active:bg-amber-600"
            >
              {t('valSendAnyway')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
