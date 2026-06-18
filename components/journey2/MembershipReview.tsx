'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type { MembershipStatus } from '@/lib/membership-service'
import { MembershipBadge } from './StatusBadges'

interface MembershipReviewProps {
  memberId: string
  status: MembershipStatus
  readOnly?: boolean
}

export function MembershipReview({ memberId, status, readOnly = false }: MembershipReviewProps) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<MembershipStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function act(to: MembershipStatus) {
    if (busy) return
    if (to === 'rejected' && !note.trim()) {
      setError('A note is required when rejecting a registration.')
      return
    }
    setBusy(to)
    setError(null)
    try {
      const res = await fetch('/api/members/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, status: to, note: note.trim() || undefined })
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Action failed')
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
    <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Membership</h2>
        <MembershipBadge status={status} />
      </div>

      {readOnly ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>Read-only — sign in as secretariat to act.</p>
      ) : (
        <>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (required to reject; optional otherwise)"
            rows={2}
            style={{ width: '100%', padding: '0.55rem 0.7rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', marginBottom: '0.75rem' }}
          />
          {error && <p style={{ color: '#991b1b', fontSize: '0.85rem', marginTop: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {status !== 'approved' && (
              <button onClick={() => act('approved')} disabled={busy !== null} style={btn('#16a34a')}>
                {busy === 'approved' ? 'Approving…' : 'Approve'}
              </button>
            )}
            {status !== 'rejected' && (
              <button onClick={() => act('rejected')} disabled={busy !== null} style={btn('#dc2626')}>
                {busy === 'rejected' ? 'Rejecting…' : 'Reject'}
              </button>
            )}
            {status === 'rejected' && (
              <button onClick={() => act('pending')} disabled={busy !== null} style={btn('#f59e0b')}>
                {busy === 'pending' ? 'Re-opening…' : 'Re-open (re-invite)'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function btn(colour: string): React.CSSProperties {
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
