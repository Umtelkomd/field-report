import { t, type TranslationKey } from './i18n'
import { WC_BASEMENT, WC_WE_PHOTOS } from '../data/wcPhotos'
import { NE4_CHECKS } from '../data/ne4Checklist'
import type { Lang, PhotoQuality, ValidationResult } from '../types'

interface ValidationInput {
  ha: string
  startTime: string
  endTime: string
  date: string
  units: string
  variant: string
  comments: string
  photos: Record<string, string[]>
  photoQuality: Record<string, PhotoQuality[]>
  checkedItems: string[]
  protocols: string[]
  lang: Lang
}

export function computeValidationScore(input: ValidationInput): ValidationResult {
  const {
    ha, startTime, endTime, date, units, variant, comments,
    photos, photoQuality, checkedItems, protocols, lang,
  } = input

  const items: ValidationResult['items'] = []
  let totalPoints = 0
  let earnedPoints = 0

  const hasPhoto = (id: string) => photos[id] && photos[id].length > 0

  // --- 1. Basic data (weight: 20) ---
  const basicFields = [ha, startTime, endTime, date, units, variant]
  const basicFilled = basicFields.filter((v) => v).length
  const basicOk = basicFilled === basicFields.length
  totalPoints += 20
  earnedPoints += basicOk ? 20 : Math.round((20 * basicFilled) / basicFields.length)
  items.push({
    label: t('valBasicData' as TranslationKey, lang),
    ok: basicOk,
    detail: basicOk
      ? `✅ ${t('valComplete' as TranslationKey, lang)}`
      : `❌ ${t('valIncomplete' as TranslationKey, lang)} (${basicFilled}/${basicFields.length})`,
    cssClass: basicOk ? 'text-success' : 'text-danger',
  })

  // --- 2. HA format (weight: 5) ---
  const haFormatOk = /^HA\d+$/i.test(ha)
  totalPoints += 5
  earnedPoints += haFormatOk ? 5 : ha ? 2 : 0
  items.push({
    label: t('valHaFormat' as TranslationKey, lang),
    ok: haFormatOk,
    detail: haFormatOk
      ? '✅ OK'
      : ha
        ? `⚠️ ${t('valHaFormatHint' as TranslationKey, lang)}`
        : '❌',
    cssClass: haFormatOk ? 'text-success' : ha ? 'text-warning' : 'text-danger',
  })

  // --- 3. Photos (weight: 30) ---
  const numWe = parseInt(units) || 0
  const expectedBasement = 3
  const expectedPerWe = 2
  const expectedTotal = expectedBasement + numWe * expectedPerWe

  const actualBasement = WC_BASEMENT.filter((p) => hasPhoto(p.id)).length
  let actualWe = 0
  for (let i = 1; i <= numWe; i++) {
    const weId = 'we' + String(i).padStart(2, '0')
    actualWe += WC_WE_PHOTOS.filter((p) => hasPhoto(`${weId}_${p.suffix}`)).length
  }
  const actualTotal = actualBasement + actualWe

  const photoRatio = expectedTotal > 0 ? Math.min(actualTotal / expectedTotal, 1) : 1
  totalPoints += 30

  let badPhotoCount = 0
  Object.values(photoQuality).forEach((arr) => {
    if (arr) arr.forEach((q) => { if (q?.warnings?.length > 0) badPhotoCount++ })
  })
  const qualityPenalty = Math.min(badPhotoCount * 5, 30)
  const photoPoints = Math.max(0, Math.round(30 * photoRatio) - qualityPenalty)
  earnedPoints += photoPoints

  const photosOk = actualTotal >= expectedTotal && badPhotoCount === 0
  let photoDetail = photosOk
    ? `✅ ${actualTotal}/${expectedTotal}`
    : `⚠️ ${actualTotal}/${expectedTotal}`
  if (actualTotal < expectedTotal) {
    photoDetail += ` (${t('valMissing' as TranslationKey, lang)} ${expectedTotal - actualTotal})`
  }
  if (badPhotoCount > 0) {
    photoDetail += ` | ⚠️ ${badPhotoCount} ${t('photoQuality' as TranslationKey, lang).toLowerCase()}`
  }
  items.push({
    label: t('valPhotos' as TranslationKey, lang),
    ok: photosOk,
    detail: photoDetail,
    cssClass: photosOk ? 'text-success' : 'text-warning',
  })

  // --- 4. Checklist NE4 (weight: 25) ---
  const checkedCount = NE4_CHECKS.filter((c) => checkedItems.includes(c.id)).length
  const checklistOk = checkedCount === NE4_CHECKS.length
  const checkRatio = NE4_CHECKS.length > 0 ? checkedCount / NE4_CHECKS.length : 1
  totalPoints += 25
  earnedPoints += Math.round(25 * checkRatio)
  items.push({
    label: t('valChecklist' as TranslationKey, lang),
    ok: checklistOk,
    detail: checklistOk
      ? `✅ ${checkedCount}/${NE4_CHECKS.length}`
      : `⚠️ ${checkedCount}/${NE4_CHECKS.length}`,
    cssClass: checklistOk ? 'text-success' : 'text-warning',
  })

  // --- 5. Protocols (weight: 10) ---
  const protsChecked = protocols.length
  const protsOk = protsChecked === 4
  totalPoints += 10
  earnedPoints += Math.round((10 * protsChecked) / 4)
  items.push({
    label: t('valProtocols' as TranslationKey, lang),
    ok: protsOk,
    detail: protsOk ? `✅ ${protsChecked}/4` : `⚠️ ${protsChecked}/4`,
    cssClass: protsOk ? 'text-success' : 'text-warning',
  })

  // --- 6. Comments (weight: 10) ---
  const commentsOk = comments.length > 0
  totalPoints += 10
  earnedPoints += commentsOk ? 10 : 0
  items.push({
    label: t('valComments' as TranslationKey, lang),
    ok: commentsOk,
    detail: commentsOk
      ? `✅ ${t('valIncluded' as TranslationKey, lang)}`
      : `⚠️ ${t('valNotIncluded' as TranslationKey, lang)}`,
    cssClass: commentsOk ? 'text-success' : 'text-warning',
  })

  const score = totalPoints > 0 ? Math.round((100 * earnedPoints) / totalPoints) : 0

  return { items, totalPoints, earnedPoints, score }
}
