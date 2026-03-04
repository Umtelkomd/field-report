import { useCallback, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { compressPhoto, checkPhotoQuality } from '../lib/photoUtils'
import { useTranslation } from './useTranslation'

export function usePhotoCapture() {
  const { addPhoto } = useAppStore()
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const currentFieldRef = useRef<string>('')

  const openCamera = useCallback((fieldId: string) => {
    currentFieldRef.current = fieldId
    if (inputRef.current) {
      inputRef.current.click()
    }
  }, [])

  const handleFiles = useCallback(
    async (files: FileList) => {
      const fieldId = currentFieldRef.current
      for (const file of Array.from(files)) {
        try {
          const dataUrl = await compressPhoto(file)
          const quality = await checkPhotoQuality(
            dataUrl,
            t('photoBlurry'),
            t('photoDark'),
            t('photoOverexposed')
          )
          addPhoto(fieldId, dataUrl, quality)
        } catch (err) {
          console.error('Photo error:', err)
        }
      }
    },
    [addPhoto, t]
  )

  return { inputRef, openCamera, handleFiles }
}
