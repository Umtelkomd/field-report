import { ChevronLeft } from 'lucide-react'
import { useOnline } from '../../hooks/useOnline'
import { useTranslation } from '../../hooks/useTranslation'
import { useAppStore } from '../../store/appStore'

export function StatusBar() {
  const online = useOnline()
  const { t, lang } = useTranslation()
  const setLang = useAppStore((s) => s.setLang)
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const clientType = useAppStore((s) => s.clientType)

  const showBack = view !== 'pin' && view !== 'member'

  const goBack = () => {
    if (view === 'admin') setView('pin')
    else if (view === 'history') setView('form')
    else if (view === 'form') setView(clientType === 'westconnect' ? 'citas' : 'member')
    else if (view === 'citas') setView('member')
    else setView('pin')
  }

  return (
    <div className="sticky top-0 z-50 flex h-[52px] items-center justify-between border-b border-gray-100 bg-white/80 px-3 backdrop-blur-lg">
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            onClick={goBack}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 active:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <div className="h-8 w-8" />
        )}
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              online ? 'bg-brand-500 animate-pulse-slow' : 'bg-orange-400'
            }`}
          />
          <span className="text-[12px] font-medium text-gray-400">
            {online ? t('online') : t('offline')}
          </span>
        </div>
      </div>
      <div className="flex rounded-lg bg-gray-100 p-0.5">
        <button
          onClick={() => setLang('es')}
          className={`rounded-md px-3 py-1 text-[11px] font-bold transition-all ${
            lang === 'es'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-400'
          }`}
        >
          ES
        </button>
        <button
          onClick={() => setLang('de')}
          className={`rounded-md px-3 py-1 text-[11px] font-bold transition-all ${
            lang === 'de'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-400'
          }`}
        >
          DE
        </button>
      </div>
    </div>
  )
}
