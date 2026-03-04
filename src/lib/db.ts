import { DB_NAME, DB_VERSION, DB_STORE } from './constants'
import type { Submission } from '../types'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror = () => reject(req.error)
  })
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getAll(): Promise<Submission[]> {
  const db = await open()
  const tx = db.transaction(DB_STORE, 'readonly')
  return promisify(tx.objectStore(DB_STORE).getAll())
}

export async function add(data: Submission): Promise<IDBValidKey> {
  const db = await open()
  const tx = db.transaction(DB_STORE, 'readwrite')
  return promisify(tx.objectStore(DB_STORE).add(data))
}

export async function put(data: Submission): Promise<IDBValidKey> {
  const db = await open()
  const tx = db.transaction(DB_STORE, 'readwrite')
  return promisify(tx.objectStore(DB_STORE).put(data))
}

export async function getPending(): Promise<Submission[]> {
  const all = await getAll()
  return all.filter((s) => s.pendingSync)
}

export async function markSynced(id: number): Promise<void> {
  const db = await open()
  const tx = db.transaction(DB_STORE, 'readwrite')
  const store = tx.objectStore(DB_STORE)
  const item = await promisify(store.get(id))
  if (item) {
    item.pendingSync = false
    await promisify(store.put(item))
  }
}

// Migration: import from old DBs on first load
export async function migrateOldDBs(): Promise<number> {
  let migrated = 0
  const oldNames = ['FieldReportDB', 'FieldReportWC', 'FieldReportGFP']

  for (const name of oldNames) {
    try {
      const req = indexedDB.open(name, 1)
      const db: IDBDatabase = await new Promise((resolve, reject) => {
        req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result)
        req.onerror = () => reject(req.error)
        req.onupgradeneeded = () => {
          // DB doesn't exist, close and skip
          req.transaction?.abort()
        }
      })
      if (db.objectStoreNames.contains('submissions')) {
        const tx = db.transaction('submissions', 'readonly')
        const old: Submission[] = await promisify(tx.objectStore('submissions').getAll())
        for (const item of old) {
          await add({ ...item, id: undefined })
          migrated++
        }
      }
      db.close()
    } catch {
      // DB doesn't exist or can't read, skip
    }
  }
  return migrated
}
