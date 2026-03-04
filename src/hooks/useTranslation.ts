import { useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { t, type TranslationKey } from '../lib/i18n'

export function useTranslation() {
  const lang = useAppStore((s) => s.lang)
  const translate = useCallback(
    (key: TranslationKey) => t(key, lang),
    [lang]
  )
  return { t: translate, lang }
}
