import {
  PHOTO_MAX_WIDTH,
  PHOTO_QUALITY,
  BLUR_THRESHOLD,
  DARK_THRESHOLD,
  BRIGHT_THRESHOLD,
} from './constants'
import type { PhotoQuality } from '../types'

export function compressPhoto(file: File, maxW = PHOTO_MAX_WIDTH, quality = PHOTO_QUALITY): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width
        let h = img.height
        if (w > maxW) {
          h = Math.round((h * maxW) / w)
          w = maxW
        }
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function toGrayscale(imageData: ImageData): Float32Array {
  const d = imageData.data
  const len = d.length / 4
  const gray = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]
  }
  return gray
}

function laplacianVariance(gray: Float32Array, w: number, h: number): number {
  let sum = 0
  let sum2 = 0
  let n = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const val =
        -4 * gray[y * w + x] +
        gray[(y - 1) * w + x] +
        gray[(y + 1) * w + x] +
        gray[y * w + x - 1] +
        gray[y * w + x + 1]
      sum += val
      sum2 += val * val
      n++
    }
  }
  if (n === 0) return 999
  const mean = sum / n
  return sum2 / n - mean * mean
}

function averageBrightness(gray: Float32Array): number {
  let sum = 0
  for (let i = 0; i < gray.length; i++) sum += gray[i]
  return gray.length > 0 ? sum / gray.length : 128
}

export function checkPhotoQuality(
  dataUrl: string,
  blurryLabel: string,
  darkLabel: string,
  overexposedLabel: string
): Promise<PhotoQuality> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const scale = Math.min(200 / img.width, 200 / img.height, 1)
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const gray = toGrayscale(imageData)
      const blur = laplacianVariance(gray, canvas.width, canvas.height)
      const brightness = averageBrightness(gray)
      const warnings: string[] = []
      if (blur < BLUR_THRESHOLD) warnings.push(blurryLabel)
      if (brightness < DARK_THRESHOLD) warnings.push(darkLabel)
      if (brightness > BRIGHT_THRESHOLD) warnings.push(overexposedLabel)
      resolve({
        isBlurry: blur < BLUR_THRESHOLD,
        isDark: brightness < DARK_THRESHOLD,
        isOverexposed: brightness > BRIGHT_THRESHOLD,
        blurScore: blur,
        brightness,
        warnings,
      })
    }
    img.onerror = () =>
      resolve({
        isBlurry: false,
        isDark: false,
        isOverexposed: false,
        blurScore: 999,
        brightness: 128,
        warnings: [],
      })
    img.src = dataUrl
  })
}
