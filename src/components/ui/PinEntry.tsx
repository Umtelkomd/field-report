import { useCallback, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { useTranslation } from '../../hooks/useTranslation'
import { ADMIN_PIN } from '../../lib/constants'

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
]

export function PinEntry() {
  const { t } = useTranslation()
  const { pin, setPin, teamsMap, configLoaded, setCurrentTeam, setView, addToast } =
    useAppStore()
  const [shake, setShake] = useState(false)

  const handleKey = useCallback(
    (key: string) => {
      if (key === 'del') {
        setPin(pin.slice(0, -1))
        return
      }
      if (key === '' || pin.length >= 4) return
      const next = pin + key
      setPin(next)

      if (next.length === 4) {
        setTimeout(() => {
          if (!configLoaded) {
            setTimeout(() => handleKey(''), 500)
            return
          }
          if (next === ADMIN_PIN) {
            setView('admin')
            setPin('')
            return
          }
          const team = teamsMap[next]
          if (!team) {
            addToast(t('invalidPin'), 'error')
            setShake(true)
            setTimeout(() => setShake(false), 500)
            setPin('')
            return
          }
          setCurrentTeam(team)
          if (team.members.length > 0) {
            setView('member')
          } else {
            setView('form')
          }
          setPin('')
        }, 250)
      }
    },
    [pin, setPin, teamsMap, configLoaded, setCurrentTeam, setView, addToast, t]
  )

  return (
    <div className="flex min-h-[calc(100vh-52px)] flex-col items-center justify-between px-6 pb-8 pt-12">
      {/* Top: Logo + Title */}
      <div className="flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow">
          <span className="text-2xl font-black tracking-tight text-white">FR</span>
        </div>
        <h1 className="mb-0.5 text-xl font-extrabold tracking-tight text-gray-900">
          Field Report
        </h1>
        <p className="text-[13px] font-medium text-gray-400">Umtelkomd</p>
      </div>

      {/* Middle: PIN display + label */}
      <div className="flex flex-col items-center">
        <p className="mb-5 text-[13px] font-medium text-gray-500">{t('pinLabel')}</p>
        <div className={`mb-2 flex gap-4 ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex h-4 w-4 items-center justify-center rounded-full transition-all duration-200 ${
                i < pin.length
                  ? 'scale-110 bg-brand-500 shadow-glow'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom: Keypad */}
      <div className="w-full max-w-[280px]">
        <div className="flex flex-col gap-3">
          {KEYS.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-3">
              {row.map((key, ki) => (
                <button
                  key={ki}
                  type="button"
                  onClick={() => handleKey(key)}
                  disabled={key === ''}
                  className={`flex h-[64px] w-[80px] items-center justify-center rounded-2xl text-[22px] font-semibold transition-all ${
                    key === ''
                      ? 'invisible'
                      : key === 'del'
                        ? 'bg-gray-100 text-gray-500 active:bg-gray-200'
                        : 'bg-white text-gray-800 shadow-card active:scale-95 active:bg-gray-50'
                  }`}
                >
                  {key === 'del' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                      <line x1="18" y1="9" x2="12" y2="15" />
                      <line x1="12" y1="9" x2="18" y2="15" />
                    </svg>
                  ) : (
                    key
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
