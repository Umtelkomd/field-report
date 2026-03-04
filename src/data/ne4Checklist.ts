import type { TranslationKey } from '../lib/i18n'

export interface ChecklistItem {
  id: string
  titleKey: TranslationKey
  descKey: TranslationKey
  category: 'installation' | 'measurement' | 'color' | 'baumappe' | 'photos' | 'clean'
}

export const NE4_CHECKS: ChecklistItem[] = [
  // Installation protocol (orange)
  { id: 'chk_inst_contract', titleKey: 'chkContract', descKey: 'chkContractDesc', category: 'installation' },
  { id: 'chk_inst_homeid', titleKey: 'chkHomeId', descKey: 'chkHomeIdDesc', category: 'installation' },
  { id: 'chk_inst_ont', titleKey: 'chkOntSerial', descKey: 'chkOntSerialDesc', category: 'installation' },
  { id: 'chk_inst_fiber', titleKey: 'chkFiberWe', descKey: 'chkFiberWeDesc', category: 'installation' },
  { id: 'chk_inst_gvport', titleKey: 'chkGvPort', descKey: 'chkGvPortDesc', category: 'installation' },
  { id: 'chk_inst_sign', titleKey: 'chkSignature', descKey: 'chkSignatureDesc', category: 'installation' },
  // Measurement protocol (blue)
  { id: 'chk_mess_allwe', titleKey: 'chkMessAll', descKey: 'chkMessAllDesc', category: 'measurement' },
  { id: 'chk_mess_ge', titleKey: 'chkMessGe', descKey: 'chkMessGeDesc', category: 'measurement' },
  { id: 'chk_mess_ugformat', titleKey: 'chkUgFormat', descKey: 'chkUgFormatDesc', category: 'measurement' },
  // Color coding (green)
  { id: 'chk_farb_we', titleKey: 'chkFarbWe', descKey: 'chkFarbWeDesc', category: 'color' },
  { id: 'chk_farb_ge', titleKey: 'chkFarbGe', descKey: 'chkFarbGeDesc', category: 'color' },
  { id: 'chk_farb_count', titleKey: 'chkFarbCount', descKey: 'chkFarbCountDesc', category: 'color' },
  // Baumappe (purple)
  { id: 'chk_baumappe_hochzeit', titleKey: 'chkHochzeit', descKey: 'chkHochzeitDesc', category: 'baumappe' },
  { id: 'chk_baumappe_lp', titleKey: 'chkLp', descKey: 'chkLpDesc', category: 'baumappe' },
  // Photos (red)
  { id: 'chk_fotos_apl', titleKey: 'chkFotoApl', descKey: 'chkFotoAplDesc', category: 'photos' },
  { id: 'chk_fotos_kassette', titleKey: 'chkFotoKassette', descKey: 'chkFotoKassetteDesc', category: 'photos' },
  { id: 'chk_fotos_gfta', titleKey: 'chkFotoGfta', descKey: 'chkFotoGftaDesc', category: 'photos' },
  { id: 'chk_fotos_medicion', titleKey: 'chkFotoMedicion', descKey: 'chkFotoMedicionDesc', category: 'photos' },
  // Cleanliness (teal)
  { id: 'chk_sauberkeit', titleKey: 'chkClean', descKey: 'chkCleanDesc', category: 'clean' },
]

export const CATEGORY_COLORS: Record<string, { bg: string; border: string }> = {
  installation: { bg: 'bg-orange-50', border: 'border-l-orange-400' },
  measurement: { bg: 'bg-blue-50', border: 'border-l-blue-400' },
  color: { bg: 'bg-green-50', border: 'border-l-green-400' },
  baumappe: { bg: 'bg-purple-50', border: 'border-l-purple-400' },
  photos: { bg: 'bg-red-50', border: 'border-l-red-400' },
  clean: { bg: 'bg-teal-50', border: 'border-l-teal-400' },
}
