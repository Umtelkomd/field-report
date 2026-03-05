import { useRef } from 'react'
import { Camera, FileText, X, Upload } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { compressPhoto } from '../../lib/photoUtils'

export function ProtocolSection() {
  const protocolFiles = useAppStore((s) => s.protocolFiles)
  const addProtocolFile = useAppStore((s) => s.addProtocolFile)
  const removeProtocolFile = useAppStore((s) => s.removeProtocolFile)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      try {
        if (file.type === 'application/pdf') {
          const reader = new FileReader()
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          addProtocolFile(dataUrl)
        } else if (file.type.startsWith('image/')) {
          const dataUrl = await compressPhoto(file)
          addProtocolFile(dataUrl)
        }
      } catch (err) {
        console.error('Protocol file error:', err)
      }
    }
  }

  const isPdf = (src: string) => src.startsWith('data:application/pdf')

  return (
    <section className="section-card">
      <h3 className="mb-1 text-[15px] font-extrabold text-gray-900">
        Protocolo de Instalacion
      </h3>
      <p className="mb-4 text-[12px] text-gray-400">
        Sube fotos o PDFs de los protocolos firmados (Auskundung, Installation, Mess, Farbcodierung)
      </p>

      {/* Thumbnails */}
      {protocolFiles.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {protocolFiles.map((src, i) => (
            <div
              key={i}
              className={`relative h-20 w-20 overflow-hidden rounded-xl ${
                isPdf(src)
                  ? 'ring-1 ring-blue-200 bg-blue-50'
                  : 'ring-1 ring-gray-100'
              }`}
            >
              {isPdf(src) ? (
                <div className="flex h-full w-full flex-col items-center justify-center">
                  <FileText size={24} className="text-blue-500" />
                  <span className="text-[9px] font-bold text-blue-500">PDF</span>
                </div>
              ) : (
                <img src={src} alt="" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeProtocolFile(i)}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3 text-[13px] font-semibold text-gray-400 active:border-brand-300 active:bg-brand-50 active:text-brand-500"
        >
          <Camera size={16} />
          Foto
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 py-3 text-[13px] font-semibold text-blue-400 active:border-blue-400 active:bg-blue-50 active:text-blue-600"
        >
          <Upload size={16} />
          Archivo
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {protocolFiles.length > 0 && (
        <p className="mt-2 text-[11px] text-gray-300">
          {protocolFiles.length} archivo{protocolFiles.length !== 1 ? 's' : ''} adjunto{protocolFiles.length !== 1 ? 's' : ''}
        </p>
      )}
    </section>
  )
}
