import type { PhotoDef } from '../types'

const ALWAYS: PhotoDef[] = [
  { id: 'gfp_ta_entrada', label: '4.1 ONT/TA Abierta - Entrada cable', required: true },
  { id: 'gfp_ta_fusion', label: '4.2 ONT/TA Abierta - Bandeja Fusión', required: true },
  { id: 'gfp_ta_cerrada', label: '4.3 ONT/TA Cerrada + Etiqueta Home ID (QR)', required: true },
  { id: 'gfp_activacion', label: '6.1 Captura Activación en App Cliente', required: true },
  { id: 'gfp_patch_nvt', label: '7.1 Patch en POP/NVT', required: true },
  { id: 'gfp_luz_roja', label: '8.1 Luz Roja - Fibras NVT a OTB/AP', required: true },
  { id: 'gfp_fusion_dp', label: '9.1 Fusión DP/NVT - Bandeja + Etiqueta', required: true },
]

const OBRA_CIVIL: PhotoDef[] = [
  { id: 'gfp_pre_ext', label: '1.1 Previo trabajos - Pasamuros Exterior', required: true },
  { id: 'gfp_pre_int', label: '1.2 Previo trabajos - Pasamuros Interior', required: true },
  { id: 'gfp_post_ext', label: '2.1 Post trabajos - Pasamuros Exterior', required: true },
  { id: 'gfp_post_int', label: '2.2 Post trabajos - Pasamuros Interior', required: true },
]

const OTB_AP: PhotoDef[] = [
  { id: 'gfp_otb_entrada', label: '3.1 OTB/AP Abierta - Entrada cable + splitter', required: true },
  { id: 'gfp_otb_fusion', label: '3.2 OTB/AP Abierta - Bandeja Fusión', required: true },
  { id: 'gfp_otb_cerrada', label: '3.3 OTB/AP Cerrada + Etiqueta KLS ID', required: true },
]

const INTERIOR_SDU2: PhotoDef[] = [
  { id: 'gfp_canal_ap_entrada', label: '5.1 Canalizado: OTB/AP a Entrada Vivienda', required: true },
  { id: 'gfp_cable_ap_entrada', label: '5.4 Cableado: OTB/AP a Entrada Vivienda', required: true },
  { id: 'gfp_cable_entrada_ta', label: '5.7 Cableado: Entrada Vivienda - ONT/TA', required: true },
]

const INTERIOR_SDU1: PhotoDef[] = [
  { id: 'gfp_cable_ap_entrada', label: '5.4 Cableado: OTB/AP a Entrada Vivienda', required: true },
  { id: 'gfp_cable_entrada_ta', label: '5.7 Cableado: Entrada Vivienda - ONT/TA', required: true },
]

const INTERIOR_MDU: PhotoDef[] = [
  { id: 'gfp_canal_ap_sp', label: '5.2 Canalizado: OTB/AP a SammelPunkt', required: true },
  { id: 'gfp_canal_sp_entrada', label: '5.3 Canalizado: SammelPunkt a Entrada Vivienda', required: true },
  { id: 'gfp_cable_ap_sp', label: '5.5 Cableado: OTB/AP a SammelPunkt', required: true },
  { id: 'gfp_cable_sp_entrada', label: '5.6 Cableado: SammelPunkt a Entrada Vivienda', required: true },
  { id: 'gfp_cable_entrada_ta', label: '5.7 Cableado: Entrada Vivienda - ONT/TA', required: true },
]

export function getGfpRequiredPhotos(buildingType: string): PhotoDef[] {
  let photos = [...ALWAYS]
  if (['sdu1-ap+ta', 'sdu2', 'mdu3'].includes(buildingType)) {
    photos = [...OBRA_CIVIL, ...OTB_AP, ...photos]
  }
  if (buildingType === 'sdu2') {
    photos.splice(-ALWAYS.length, 0, ...INTERIOR_SDU2)
  } else if (buildingType === 'sdu1-ap+ta') {
    photos.splice(-ALWAYS.length, 0, ...INTERIOR_SDU1)
  } else if (buildingType === 'mdu3') {
    photos.splice(-ALWAYS.length, 0, ...INTERIOR_MDU)
  }
  return photos
}
