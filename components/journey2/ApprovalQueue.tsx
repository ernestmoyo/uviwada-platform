'use client'

import { useMemo, useState } from 'react'
import { fmtDate, fmtDateTime } from '@/lib/format'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import type { QueueMember } from '@/lib/journey2-data'

interface ApprovalQueueProps {
  members: QueueMember[]
  checkedAt: string
  readOnly?: boolean
}

export function ApprovalQueue({ members, checkedAt, readOnly = false }: ApprovalQueueProps) {
  const router = useRouter()
  const [incompleteOnly, setIncompleteOnly] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (incompleteOnly && !m.incomplete) return false
      if (from && m.joined_at.slice(0, 10) < from) return false
      if (to && m.joined_at.slice(0, 10) > to) return false
      return true
    })
  }, [members, incompleteOnly, from, to])

  async function setStatus(id: string, status: 'approved' | 'rejected') {
    if (busyId) return
    if (status === 'rejected' && !window.confirm('Reject this registration? The centre will be blocked from the member portal until re-approved.')) return
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch('/api/members/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: id, status })
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) {
        setError(json.error ?? `Could not ${status === 'approved' ? 'approve' : 'reject'}`)
        setBusyId(null)
        return
      }
      router.refresh()
      setBusyId(null)
    } catch {
      setError('Network error — please try again.')
      setBusyId(null)
    }
  }

  return (
    <section
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: 'var(--shadow)',
        padding: '1.25rem',
        marginBottom: '2rem',
        border: members.length > 0 ? '1px solid #fcd34d' : '1px solid var(--border)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', margin: 0 }}>
          Approval Queue {members.length > 0 && <span style={{ color: '#b45309' }}>· {members.length} pending</span>}
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
          Last checked {fmtDateTime(checkedAt)}
        </span>
      </div>

      {members.length === 0 ? (
        <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--muted)' }}>
          No pending registrations.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', margin: '0.85rem 0' }}>
            <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <input type="checkbox" checked={incompleteOnly} onChange={(e) => setIncompleteOnly(e.target.checked)} />
              Incomplete only
            </label>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={dateInput} />
            </label>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={dateInput} />
            </label>
          </div>

          {error && <p style={{ color: '#991b1b', fontSize: '0.85rem' }}>{error}</p>}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                  <th style={qth}>Centre</th>
                  <th style={qth}>Email</th>
                  <th style={qth}>Registered</th>
                  <th style={qth}>Completeness</th>
                  <th style={qth}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--muted)' }}>
                      No registrations match these filters.
                    </td>
                  </tr>
                )}
                {filtered.map((m) => (
                  <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={qtd}>
                      <strong>{m.centre_name}</strong>
                      <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                        {m.ward} · {m.district} · {m.phone}
                      </div>
                    </td>
                    <td style={qtd}>{m.email ?? '—'}</td>
                    <td style={qtd}>{fmtDate(m.joined_at)}</td>
                    <td style={qtd}>
                      {m.incomplete ? (
                        <span style={{ color: '#b45309', fontWeight: 600 }} title={m.missing.join(', ')}>
                          ⚠ missing {m.missing.join(', ')}
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ complete</span>
                      )}
                    </td>
                    <td style={qtd}>
                      <Link href={`/admin/members/${m.id}`} style={{ color: 'var(--primary)', fontWeight: 600, marginRight: '0.75rem' }}>
                        Review →
                      </Link>
                      {!readOnly && (
                        <>
                          <button onClick={() => setStatus(m.id, 'approved')} disabled={busyId !== null} style={approveBtn}>
                            {busyId === m.id ? '…' : 'Approve'}
                          </button>
                          <button onClick={() => setStatus(m.id, 'rejected')} disabled={busyId !== null} style={rejectBtn}>
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

const dateInput: React.CSSProperties = {
  padding: '0.3rem 0.4rem',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: '0.8rem',
  marginLeft: '0.25rem'
}
const qth: React.CSSProperties = { padding: '0.5rem 0.6rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }
const qtd: React.CSSProperties = { padding: '0.55rem 0.6rem', verticalAlign: 'top' }
const approveBtn: React.CSSProperties = {
  padding: '0.25rem 0.7rem',
  borderRadius: 6,
  border: '1px solid #16a34a',
  background: '#16a34a',
  color: '#fff',
  fontSize: '0.78rem',
  fontWeight: 600,
  cursor: 'pointer'
}
const rejectBtn: React.CSSProperties = {
  padding: '0.25rem 0.7rem',
  borderRadius: 6,
  border: '1px solid #dc2626',
  background: '#fff',
  color: '#dc2626',
  fontSize: '0.78rem',
  fontWeight: 600,
  cursor: 'pointer',
  marginLeft: '0.4rem'
}
