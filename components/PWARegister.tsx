'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(async (reg) => {
        if ('sync' in reg) {
          try {
            // Trigger a sync attempt on every load
            await (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(
              'uviwada-sync-assessments'
            )
          } catch {
            // Background Sync not supported — fall back to message-based drain
            navigator.serviceWorker.controller?.postMessage({ type: 'sync-now' })
          }
        } else {
          navigator.serviceWorker.controller?.postMessage({ type: 'sync-now' })
        }
      })
      .catch(() => {
        // SW registration failure is not fatal; the site still works online
      })

    // When connectivity returns, ask the SW to drain the queue
    const onOnline = () => {
      navigator.serviceWorker.controller?.postMessage({ type: 'sync-now' })
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return null
}
