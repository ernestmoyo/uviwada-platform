'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type { ProfileSectionRow } from '@/lib/journey2-data'
import { SECTION_LABELS, type ProfilePublicStatus, type SectionKey } from '@/lib/journey2-constants'
import { ProfileBadge, SectionBadge } from './StatusBadges'

interface ProfileModerationProps {
  memberId: string
  profileStatus: ProfilePublicStatus
  sections: ProfileSectionRow[]
  readOnly?: boolean
}

export function ProfileModeration({ memberId, profileStatus, sections, readOnly = false }: ProfileModerationProps) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')

  async function toggleSection(sectionKey: string, to: 'published' | 'hidden') {
    if (busy) return
    setBusy(`section:${sectionKey}`)
    setError(null)
    try {
      const res = await fetch('/api/members/profile-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, section_key: sectionKey, status: to })
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Could not update section')
        setBusy(null)
        return
      }
      router.refresh()
      setBusy(null)
    } catch {
      setError('Network error — please try again.')
      setBusy(null)
    }
  }

  async function setOverall(to: ProfilePublicStatus) {
    if (busy) return
    if (to === 'pending_update' && !note.trim()) {
      setError('A note is required when requesting an update.')
      return
    }
    setBusy(`overall:${to}`)
    setError(null)
    try {
      const res = await fetch('/api/members/profile-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, status: to, note: note.trim() || undefined })
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Could not update profile status')
        setBusy(null)
        return
      }
      setNote('')
      router.refresh()
      setBusy(null)
    } catch {
      setError('Network error — please try again.')
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 8, padding: '0.7rem 1rem', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* Step 3 — section-by-section moderation */}
      <section style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Profile sections</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 0 }}>
          Only sections the member consented to share can be published. Non-consented sections are locked.
        </p>
        {sections.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No sections yet — they are created when the membership is approved.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {sections.map((s) => {
              const label = SECTION_LABELS[s.section_key as SectionKey]?.en ?? s.section_key
              const locked = !s.consent_given
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: locked ? 'var(--bg-alt)' : '#fff',
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.92rem' }}>{label}</strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                      {s.consent_given ? 'Consented to share' : 'Not consented — locked'}
                      {s.content ? ` · ${summarise(s.content)}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <SectionBadge status={s.public_status} />
                    {!readOnly && !locked && (
                      <button
                        onClick={() => toggleSection(s.section_key, s.public_status === 'published' ? 'hidden' : 'published')}
                        disabled={busy !== null}
                        style={toggleBtn(s.public_status === 'published')}
                      >
                        {s.public_status === 'published' ? 'Hide' : 'Publish'}
                      </button>
                    )}
                    {locked && <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>🔒 locked</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Step 4 — overall public status */}
      <section style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Overall public status</h2>
          <ProfileBadge status={profileStatus} />
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 0 }}>
          Controls whether the profile appears in the public directory — independent of the per-section toggles. All states are reversible.
        </p>
        {readOnly ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Read-only — sign in as secretariat to act.</p>
        ) : (
          <>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (required for Request Update)"
              rows={2}
              style={{ width: '100%', padding: '0.55rem 0.7rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', marginBottom: '0.75rem' }}
            />
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {profileStatus !== 'published' && (
                <button onClick={() => setOverall('published')} disabled={busy !== null} style={ovBtn('#16a34a')}>
                  Publish
                </button>
              )}
              {profileStatus !== 'hidden' && (
                <button onClick={() => setOverall('hidden')} disabled={busy !== null} style={ovBtn('#64748b')}>
                  Hide
                </button>
              )}
              {profileStatus !== 'pending_update' && (
                <button onClick={() => setOverall('pending_update')} disabled={busy !== null} style={ovBtn('#f59e0b')}>
                  Request Update
                </button>
              )}
              {profileStatus !== 'draft' && (
                <button onClick={() => setOverall('draft')} disabled={busy !== null} style={ovBtn('#94a3b8')}>
                  Back to Draft
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function summarise(content: Record<string, unknown>): string {
  return Object.entries(content)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(', ')
}

function toggleBtn(isPublished: boolean): React.CSSProperties {
  const colour = isPublished ? '#64748b' : '#16a34a'
  return {
    padding: '0.3rem 0.8rem',
    borderRadius: 6,
    border: `1px solid ${colour}`,
    background: '#fff',
    color: colour,
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer'
  }
}

function ovBtn(colour: string): React.CSSProperties {
  return {
    padding: '0.45rem 1rem',
    borderRadius: 8,
    border: `1px solid ${colour}`,
    background: colour,
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer'
  }
}
