'use client'

import { useEffect, useState } from 'react'

export function OfflineBanner() {
  const [online, setOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    setOnline(navigator.onLine)
    const onUp = () => setOnline(true)
    const onDown = () => setOnline(false)
    window.addEventListener('online', onUp)
    window.addEventListener('offline', onDown)

    // Listen for SW sync-complete messages and refresh pending count
    function onMsg(e: MessageEvent) {
      if (e.data?.type === 'sync-complete') {
        setPendingCount(0)
      }
    }
    navigator.serviceWorker?.addEventListener('message', onMsg)

    // Periodically check the IndexedDB queue length
    const interval = window.setInterval(refreshPending, 5000)
    refreshPending()

    return () => {
      window.removeEventListener('online', onUp)
      window.removeEventListener('offline', onDown)
      navigator.serviceWorker?.removeEventListener('message', onMsg)
      window.clearInterval(interval)
    }
  }, [])

  async function refreshPending() {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('uviwada-sync', 1)
        req.onupgradeneeded = () => {
          req.result.createObjectStore('pending-assessments', { keyPath: 'id', autoIncrement: true })
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      const tx = db.transaction('pending-assessments', 'readonly')
      const req = tx.objectStore('pending-assessments').count()
      req.onsuccess = () => setPendingCount(req.result)
    } catch {
      // ignore
    }
  }

  if (online && pendingCount === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: online ? '#1A5FAA' : '#ef4444',
        color: '#fff',
        padding: '0.55rem 1rem',
        borderRadius: 999,
        fontSize: '0.85rem',
        fontWeight: 600,
        boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
        zIndex: 100
      }}
    >
      {online
        ? `🔄 ${pendingCount} queued — syncing…`
        : `⚡ Offline — ${pendingCount > 0 ? `${pendingCount} queued` : 'submissions will queue'}`}
    </div>
  )
}
