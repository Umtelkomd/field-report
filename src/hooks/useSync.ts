import { useEffect, useRef } from 'react'
import { useOnline } from './useOnline'
import { useAppStore } from '../store/appStore'
import * as db from '../lib/db'
import { submitReport } from '../lib/api'

const MAX_RETRIES = 3
const RETRY_DELAY = 2000

export function useSync() {
  const online = useOnline()
  const addToast = useAppStore((s) => s.addToast)
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!online || syncingRef.current) return

    const sync = async () => {
      syncingRef.current = true
      try {
        const pending = await db.getPending()
        if (pending.length === 0) return

        addToast(`🔄 Sincronizando ${pending.length} envío(s)...`, 'info')

        for (const sub of pending) {
          let success = false
          for (let attempt = 0; attempt < MAX_RETRIES && !success; attempt++) {
            try {
              await submitReport(sub)
              if (sub.id) await db.markSynced(sub.id)
              success = true
            } catch {
              if (attempt < MAX_RETRIES - 1) {
                await new Promise((r) => setTimeout(r, RETRY_DELAY * (attempt + 1)))
              }
            }
          }
        }

        addToast('✅ Sincronización completada', 'success')
      } catch (e) {
        console.error('Sync error:', e)
      } finally {
        syncingRef.current = false
      }
    }

    void sync()
  }, [online, addToast])
}
