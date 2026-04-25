'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt({ compact = false }: { compact?: boolean }) {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault()
      setEvt(e as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    if ((window.matchMedia('(display-mode: standalone)') as MediaQueryList).matches) {
      setInstalled(true)
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) {
    return (
      <div
        style={{
          background: 'rgba(34, 197, 94, 0.1)',
          color: '#16a34a',
          padding: '0.55rem 0.85rem',
          borderRadius: 8,
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        ✓ Installed on this device
      </div>
    )
  }

  if (!evt) {
    if (compact) return null
    return (
      <div
        style={{
          background: 'var(--bg-alt)',
          padding: '0.85rem 1rem',
          borderRadius: 10,
          fontSize: '0.85rem',
          color: 'var(--muted)'
        }}
      >
        On Android Chrome: tap the <strong>⋮ menu</strong> → <strong>Add to Home screen</strong> to install the
        UVIWADA Assessor app. Works fully offline once installed.
      </div>
    )
  }

  async function install() {
    if (!evt) return
    setBusy(true)
    await evt.prompt()
    const choice = await evt.userChoice
    setBusy(false)
    if (choice.outcome === 'accepted') {
      setInstalled(true)
      setEvt(null)
    }
  }

  return (
    <button
      onClick={install}
      disabled={busy}
      className="btn btn-primary"
      style={{ padding: compact ? '0.45rem 0.95rem' : '0.7rem 1.4rem', fontSize: compact ? '0.85rem' : '0.95rem' }}
    >
      {busy ? 'Installing…' : '📱 Install UVIWADA Assessor app'}
    </button>
  )
}
