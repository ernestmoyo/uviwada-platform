'use client'

import { useState } from 'react'

// Pre-launch access gate. A single shared password unlocks the whole site.
// Reads the post-login destination from the URL at submit time (relative-only)
// to avoid a useSearchParams Suspense boundary.
export default function GatePage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function safeFrom(): string {
    if (typeof window === 'undefined') return '/'
    const from = new URLSearchParams(window.location.search).get('from') ?? '/'
    // relative paths only (no open redirect)
    return from.startsWith('/') && !from.startsWith('//') ? from : '/'
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (res.ok) {
        window.location.replace(safeFrom())
      } else {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setError(j.error || 'Incorrect password')
        setBusy(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F3D6E 0%, #1A5FAA 100%)',
        padding: '1.5rem',
        fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif'
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '2.25rem 2rem',
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          textAlign: 'center'
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/uviwata_logo.png" alt="UVIWATA" style={{ height: 56, width: 'auto', margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '1.25rem', color: '#0F3D6E', margin: '0 0 0.35rem' }}>Private preview</h1>
        <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: '0 0 1.25rem' }}>
          This site is not yet public. Enter the access password to continue.
        </p>
        <form onSubmit={submit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Access password"
            autoFocus
            aria-label="Access password"
            style={{
              width: '100%',
              padding: '0.7rem 0.85rem',
              fontSize: '1rem',
              border: '1px solid #cbd5e1',
              borderRadius: 10,
              marginBottom: '0.75rem',
              boxSizing: 'border-box'
            }}
          />
          {error && (
            <p style={{ color: '#D42027', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={busy || !password}
            style={{
              width: '100%',
              padding: '0.7rem',
              fontSize: '1rem',
              fontWeight: 700,
              color: '#fff',
              background: busy || !password ? '#9CA3AF' : '#1A5FAA',
              border: 'none',
              borderRadius: 10,
              cursor: busy || !password ? 'default' : 'pointer'
            }}
          >
            {busy ? 'Checking…' : 'Enter'}
          </button>
        </form>
        <p style={{ color: '#9CA3AF', fontSize: '0.75rem', marginTop: '1.25rem' }}>
          UVIWATA · Mtoto Kwanza
        </p>
      </div>
    </main>
  )
}
