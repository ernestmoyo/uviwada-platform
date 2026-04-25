/* UVIWADA Service Worker — offline shell + assessment sync queue. */

const CACHE_VERSION = 'v1'
const SHELL_CACHE = `uviwada-shell-${CACHE_VERSION}`
const RUNTIME_CACHE = `uviwada-runtime-${CACHE_VERSION}`
const SHELL_URLS = ['/', '/assess', '/login', '/manifest.webmanifest', '/logo.svg', '/main_logo.png']

const QUEUE_DB = 'uviwada-sync'
const QUEUE_STORE = 'pending-assessments'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE && k.startsWith('uviwada-'))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Queue assessment POSTs that fail
  if (req.method === 'POST' && url.pathname === '/api/assessments') {
    event.respondWith(
      fetch(req.clone())
        .then((res) => {
          if (!res.ok) throw new Error('non-2xx')
          return res
        })
        .catch(async () => {
          const body = await req.clone().json().catch(() => null)
          if (body) await enqueueAssessment(body)
          return new Response(
            JSON.stringify({ ok: true, queued: true, message: 'Saved offline; will sync when online' }),
            { status: 202, headers: { 'Content-Type': 'application/json' } }
          )
        })
    )
    return
  }

  // For GET navigations: network-first, fall back to cache, fall back to /assess
  if (req.method === 'GET' && req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => {})
          return res
        })
        .catch(() =>
          caches.match(req).then((hit) => hit ?? caches.match('/assess').then((a) => a ?? caches.match('/')))
        )
    )
    return
  }

  // Static assets: cache-first
  if (req.method === 'GET') {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit
        return fetch(req).then((res) => {
          if (res.ok && req.url.startsWith(self.location.origin)) {
            const copy = res.clone()
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => {})
          }
          return res
        }).catch(() => caches.match('/'))
      })
    )
  }
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'uviwada-sync-assessments') {
    event.waitUntil(drainQueue())
  }
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'sync-now') {
    event.waitUntil(drainQueue())
  }
})

async function drainQueue() {
  const pending = await readQueue()
  if (pending.length === 0) return
  for (const item of pending) {
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item.payload, source: 'apk_synced' })
      })
      if (res.ok) {
        await deleteQueueItem(item.id)
      }
    } catch {
      // Network gone again — leave the item for next sync attempt
      break
    }
  }
  // Notify any open clients to refresh
  const clients = await self.clients.matchAll()
  clients.forEach((c) => c.postMessage({ type: 'sync-complete' }))
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function enqueueAssessment(payload) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    tx.objectStore(QUEUE_STORE).add({ payload, queued_at: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function readQueue() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly')
    const req = tx.objectStore(QUEUE_STORE).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

async function deleteQueueItem(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    tx.objectStore(QUEUE_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
