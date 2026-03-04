import type { PhotoDef, WePhotoDef } from '../types'

export const WC_BASEMENT: PhotoDef[] = [
  { id: 'wc_ap_gv_conexion', label: 'Conexión GF-AP / GF-GV (patchkabel)', required: true },
  { id: 'wc_ap_gv_canal', label: 'Canal/Tubo entre GF-AP y GF-GV', required: true },
  { id: 'wc_ap_antes', label: 'GF-AP Abierto ANTES de trabajos NE4', required: true },
  { id: 'wc_ap_despues', label: 'GF-AP Abierto DESPUÉS de trabajos NE4', required: true },
  { id: 'wc_ap_cerrado', label: 'GF-AP Cerrado y Precintado', required: true },
  { id: 'wc_gv_patch', label: 'Interior GF-GV - Cable Patch desde GF-AP', required: true },
  { id: 'wc_gv_acopl', label: 'Interior GF-GV - Acoplamientos fibra operativa', required: true },
  { id: 'wc_gv_empalme', label: 'Interior GF-GV - Empalme (crimp) y bandejas', required: true },
  { id: 'wc_gv_puertos', label: 'Interior GF-GV - Salida de puertos (1,3,5,7...)', required: true },
  { id: 'wc_gv_cerrado', label: 'GF-GV Cerrado con canal saliente', required: true },
  { id: 'wc_sello_sotano', label: 'Sello Cortafuegos sótano', required: false },
]

export const WC_WE_PHOTOS: WePhotoDef[] = [
  { suffix: 'gfta', label: 'GF-TA con pegatinas Home ID + publicidad', required: true },
  { suffix: 'patch', label: 'Cable patch GF-TA ↔ ONT', required: true },
  { suffix: 'ont_led', label: 'ONT funcionando (LEDs visibles)', required: true },
  { suffix: 'canal', label: 'Canal superficial hasta GF-TA', required: true },
  { suffix: 'ont_serie', label: 'Nº Serie ONT (ALCL...)', required: true },
  { suffix: 'medicion', label: 'Medición de fibra', required: true },
  { suffix: 'sobrelong', label: 'Sobrelongitudes', required: false },
]

export const WC_EXTERIOR: PhotoDef[] = [
  { id: 'wc_canal_ext', label: 'Canal pasillo / escalera / exterior', required: true },
  { id: 'wc_sello_ext', label: 'Sello Cortafuegos exterior', required: false },
]
