'use client'

import { useEffect, useMemo, useState } from 'react'

import { useI18n } from '@/lib/i18n'
import { SEED_USER_PRESETS } from '@/lib/auth-presets'
import { TENANT_PRESETS } from '@/lib/tenant-presets'

interface MemberOption {
  id: string
  centre_name: string
  ward: string
  district: string
  org_id: string
}

interface LoginRoleSwitcherProps {
  memberOptions: MemberOption[]
}

type LoginBody = { user_id: string } | { member_id: string }

interface TenantGroup {
  org_id: string
  label: string
  centres: MemberOption[]
}

export function LoginRoleSwitcher({ memberOptions }: LoginRoleSwitcherProps) {
  const { lang } = useI18n()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [pickedMemberId, setPickedMemberId] = useState<string>('')

  useEffect(() => {
    setHydrated(true)
  }, [])

  const groupedByTenant = useMemo<TenantGroup[]>(() => {
    const groups = new Map<string, TenantGroup>()
    memberOptions.forEach((m) => {
      const tenant = TENANT_PRESETS.find((t) => t.id === m.org_id)
      const label = tenant ? (lang === 'sw' ? tenant.label_sw : tenant.label_en) : 'Other'
      const existing = groups.get(m.org_id)
      if (existing) {
        existing.centres.push(m)
      } else {
        groups.set(m.org_id, { org_id: m.org_id, label, centres: [m] })
      }
    })
    // Stable order: UVIWADA-DAR first (the live region), then siblings alpha.
    return Array.from(groups.values())
      .map((g) => ({
        ...g,
        centres: [...g.centres].sort((a, b) => {
          if (a.ward !== b.ward) return a.ward.localeCompare(b.ward)
          return a.centre_name.localeCompare(b.centre_name)
        })
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [memberOptions, lang])

  async function login(body: LoginBody, busyKey: string) {
    if (!hydrated || busyId) return
    setBusyId(busyKey)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = (await res.json()) as { ok?: boolean; redirect?: string; error?: string }
      if (!res.ok || !json.ok || !json.redirect) {
        setError(json.error ?? 'Login failed')
        setBusyId(null)
        return
      }
      window.location.assign(json.redirect)
    } catch {
      setError('Network error — please check your connection and try again.')
      setBusyId(null)
    }
  }

  function loginAsStaff(userId: string) {
    return login({ user_id: userId }, userId)
  }

  function loginAsCentre() {
    if (!pickedMemberId) {
      setError(lang === 'sw' ? 'Tafadhali chagua kituo kwanza.' : 'Please pick a centre first.')
      return
    }
    return login({ member_id: pickedMemberId }, `member:${pickedMemberId}`)
  }

  return (
    <div className="portal-form-card" style={{ marginTop: '2rem' }}>
      <h3>{lang === 'sw' ? 'Chagua jukumu lako' : 'Pick your role'}</h3>
      <p className="form-note">
        {lang === 'sw'
          ? 'Demo ya UVIWADA. Hakuna nenosiri.'
          : 'UVIWADA demo. No password required.'}
      </p>

      <h4 style={sectionHeader}>{lang === 'sw' ? 'Wafanyakazi wa UVIWADA' : 'UVIWADA Staff'}</h4>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {SEED_USER_PRESETS.map((u) => (
          <button
            key={u.id}
            onClick={() => loginAsStaff(u.id)}
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
          <h4 style={sectionHeader}>
            {lang === 'sw' ? 'Mmiliki wa Kituo' : 'Daycare Centre Owner'}
          </h4>
          <p className="form-note" style={{ marginTop: 0 }}>
            {lang === 'sw'
              ? `Chagua kituo kutoka kwenye orodha (${memberOptions.length} vituo).`
              : `Pick a centre from the list (${memberOptions.length} centres registered).`}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}
          >
            <select
              value={pickedMemberId}
              onChange={(e) => setPickedMemberId(e.target.value)}
              disabled={busyId !== null}
              style={{
                padding: '0.7rem 0.85rem',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: '#fff',
                fontSize: '0.95rem',
                color: 'var(--primary-dark)',
                fontWeight: 500
              }}
              aria-label={lang === 'sw' ? 'Chagua kituo' : 'Choose centre'}
            >
              <option value="">
                {lang === 'sw' ? '— Chagua kituo —' : '— Choose a centre —'}
              </option>
              {groupedByTenant.map((group) => (
                <optgroup key={group.org_id} label={group.label}>
                  {group.centres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.ward} · {m.centre_name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button
              onClick={loginAsCentre}
              disabled={busyId !== null || !pickedMemberId}
              className="btn"
              style={{
                background: 'var(--primary)',
                color: '#fff',
                padding: '0.7rem 1.1rem',
                fontWeight: 600,
                cursor: busyId !== null || !pickedMemberId ? 'not-allowed' : 'pointer',
                opacity: !pickedMemberId ? 0.55 : 1
              }}
            >
              {lang === 'sw' ? 'Ingia →' : 'Sign in →'}
            </button>
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

const sectionHeader: React.CSSProperties = {
  marginTop: '1.5rem',
  marginBottom: '0.5rem',
  fontSize: '0.9rem',
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
}
