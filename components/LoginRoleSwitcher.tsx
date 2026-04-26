'use client'

import { useEffect, useState } from 'react'

import { useI18n } from '@/lib/i18n'
import { SEED_USER_PRESETS } from '@/lib/auth-presets'

interface MemberOption {
  id: string
  centre_name: string
  ward: string
}

interface LoginRoleSwitcherProps {
  memberOptions: MemberOption[]
}

export function LoginRoleSwitcher({ memberOptions }: LoginRoleSwitcherProps) {
  const { lang } = useI18n()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Disable buttons until React has hydrated to prevent the click-eats-itself
  // race some users hit when arriving from /assess → /login redirect.
  useEffect(() => {
    setHydrated(true)
  }, [])

  async function loginAs(userId: string) {
    if (!hydrated || busyId) return
    setBusyId(userId)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })
      const json = (await res.json()) as { ok?: boolean; redirect?: string; error?: string }
      if (!res.ok || !json.ok || !json.redirect) {
        setError(json.error ?? 'Login failed')
        setBusyId(null)
        return
      }
      // Hard navigation guarantees the new session cookie ships on the
      // very next request — softer router.push has occasionally raced with
      // the cookie write on slow Vercel cold starts.
      window.location.assign(json.redirect)
    } catch {
      setError('Network error — please check your connection and try again.')
      setBusyId(null)
    }
  }

  return (
    <div className="portal-form-card" style={{ marginTop: '2rem' }}>
      <h3>{lang === 'sw' ? 'Chagua jukumu lako' : 'Pick your role'}</h3>
      <p className="form-note">
        {lang === 'sw'
          ? 'Kwa demo hii, chagua mtumiaji ulioandaliwa tayari. Hakuna nenosiri.'
          : 'For this demo, pick a pre-seeded user. No password required.'}
      </p>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {lang === 'sw' ? 'Wafanyakazi wa UVIWADA' : 'UVIWADA Staff'}
      </h4>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {SEED_USER_PRESETS.map((u) => (
          <button
            key={u.id}
            onClick={() => loginAs(u.id)}
            disabled={busyId !== null}
            className="btn"
            style={{
              background: busyId === u.id ? 'var(--primary-dark)' : 'var(--primary)',
              color: '#fff',
              textAlign: 'left',
              padding: '0.75rem 1rem',
              cursor: busyId !== null ? 'wait' : 'pointer',
              opacity: busyId !== null && busyId !== u.id ? 0.5 : 1
            }}
          >
            <strong>{lang === 'sw' ? u.label_sw : u.label_en}</strong>
            <span style={{ display: 'block', fontSize: '0.78rem', opacity: 0.85, marginTop: '0.15rem' }}>
              {u.role}
            </span>
          </button>
        ))}
      </div>

      {memberOptions.length > 0 && (
        <>
          <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {lang === 'sw' ? 'Wamiliki wa Vituo' : 'Centre Owners (Members)'}
          </h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {memberOptions.map((m) => (
              <button
                key={m.id}
                onClick={() => loginAs(m.id)}
                disabled={busyId !== null}
                className="btn"
                style={{
                  background: '#fff',
                  color: 'var(--primary-dark)',
                  border: '1px solid var(--border)',
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  cursor: busyId !== null ? 'wait' : 'pointer'
                }}
              >
                <strong>{m.centre_name}</strong>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                  {m.ward} · member
                </span>
              </button>
            ))}
          </div>
          <p className="form-note" style={{ marginTop: '0.75rem', fontSize: '0.78rem' }}>
            {lang === 'sw'
              ? 'Wamiliki wapya hujiundia akaunti kupitia /portal/register.'
              : 'New centre owners self-register at /portal/register.'}
          </p>
        </>
      )}

      {error && (
        <p style={{ color: 'var(--accent)', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>
      )}
    </div>
  )
}
