import { t, type TranslationKey } from './i18n'
import { WC_SOTANO_BASE, WC_AP_PHOTOS, WC_WE_PHOTOS } from '../data/wcPhotos'
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
  visitType: string
  workStatus: string
  apExists: boolean
  photos: Record<string, string[]>
  photoQuality: Record<string, PhotoQuality[]>
  checkedItems: string[]
  protocols: string[]
  lang: Lang
}

export function computeValidationScore(input: ValidationInput): ValidationResult {
  const {
    ha, startTime, endTime, date, units, variant, comments,
    visitType, workStatus, apExists,
    photos, photoQuality, checkedItems, protocols, lang,
  } = input

  const items: ValidationResult['items'] = []
  let totalPoints = 0
  let earnedPoints = 0

  const hasPhoto = (id: string) => photos[id] && photos[id].length > 0
  const isSegunda = visitType === 'segunda' || workStatus === 'client-reschedule'

  // --- 1. Datos básicos (weight: 20) ---
  if (isSegunda) {
    // Segunda cita: solo fecha y hora requeridas
    const basicFields = [ha, startTime, endTime, date]
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
  } else {
    // Primera cita: todos los campos
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

    // --- 2. Formato HA (weight: 5) ---
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
  }

  // --- 3. Fotos (weight: 30) ---
  if (isSegunda) {
    // Segunda cita: fotos opcionales, no penalizar
    totalPoints += 10
    earnedPoints += 10
    items.push({
      label: t('valPhotos' as TranslationKey, lang),
      ok: true,
      detail: '✅ Fotos opcionales en segunda cita',
      cssClass: 'text-success',
    })
  } else {
    // Primera cita: validar fotos requeridas según configuración
    const numWe = parseInt(units) || 0

    // Fotos sótano
    const sotanoReq = WC_SOTANO_BASE.filter((p) => p.required)
    const sotanoFilled = sotanoReq.filter((p) => hasPhoto(p.id)).length
    const sotanoOk = sotanoFilled === sotanoReq.length

    // Fotos AP (solo si AP existe)
    const apReq = apExists ? WC_AP_PHOTOS.filter((p) => p.required) : []
    const apFilled = apReq.filter((p) => hasPhoto(p.id)).length
    const apOk = !apExists || apFilled === apReq.length

    // Fotos por WE
    const wePhotoReq = WC_WE_PHOTOS.filter((p) => p.required)
    let weFilledTotal = 0
    let weExpectedTotal = 0
    for (let i = 1; i <= numWe; i++) {
      const weId = 'we' + String(i).padStart(2, '0')
      weExpectedTotal += wePhotoReq.length
      weFilledTotal += wePhotoReq.filter((p) => hasPhoto(`${weId}_${p.suffix}`)).length
    }
    const weOk = numWe === 0 || weFilledTotal === weExpectedTotal

    const totalReq = sotanoReq.length + apReq.length + (numWe * wePhotoReq.length)
    const totalFilled = sotanoFilled + apFilled + weFilledTotal
    const photoRatio = totalReq > 0 ? Math.min(totalFilled / totalReq, 1) : 1

    // Penalización por calidad
    let badPhotoCount = 0
    Object.values(photoQuality).forEach((arr) => {
      if (arr) arr.forEach((q) => { if (q?.warnings?.length > 0) badPhotoCount++ })
    })
    const qualityPenalty = Math.min(badPhotoCount * 3, 30)

    totalPoints += 30
    const photoPoints = Math.max(0, Math.round(30 * photoRatio) - qualityPenalty)
    earnedPoints += photoPoints

    const photosAllOk = sotanoOk && apOk && weOk && badPhotoCount === 0
    let photoDetail = `${totalFilled}/${totalReq}`
    if (!sotanoOk) photoDetail += ` | Sótano: ${sotanoFilled}/${sotanoReq.length}`
    if (!apOk) photoDetail += ` | AP: ${apFilled}/${apReq.length}`
    if (!weOk) photoDetail += ` | WE: ${weFilledTotal}/${numWe * wePhotoReq.length}`
    if (badPhotoCount > 0) photoDetail += ` | ⚠️ ${badPhotoCount} calidad baja`

    items.push({
      label: t('valPhotos' as TranslationKey, lang),
      ok: photosAllOk,
      detail: photosAllOk ? `✅ ${photoDetail}` : `⚠️ ${photoDetail}`,
      cssClass: photosAllOk ? 'text-success' : totalFilled > 0 ? 'text-warning' : 'text-danger',
    })
  }

  // --- 4. Checklist NE4 (weight: 25) — solo primera cita ---
  if (!isSegunda) {
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

    // --- 5. Protocolos (weight: 10) ---
    const protsChecked = protocols.length
    const protsOk = protsChecked >= 2
    totalPoints += 10
    earnedPoints += Math.min(protsChecked * 3, 10)
    items.push({
      label: t('valProtocols' as TranslationKey, lang),
      ok: protsOk,
      detail: protsOk ? `✅ ${protsChecked}` : `⚠️ ${protsChecked}`,
      cssClass: protsOk ? 'text-success' : 'text-warning',
    })
  }

  // --- 6. Observaciones/Comentarios (weight: 10) ---
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
