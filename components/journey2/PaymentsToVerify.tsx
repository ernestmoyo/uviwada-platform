'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { fmtNum, fmtDate } from '@/lib/format'
import type { PendingPayment } from '@/lib/journey2-data'

export function PaymentsToVerify({ payments }: { payments: PendingPayment[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function verify(id: string) {
    if (busyId) return
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: id })
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Could not verify payment')
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
        marginBottom: '1.5rem',
        border: payments.length > 0 ? '1px solid #fcd34d' : '1px solid var(--border)'
      }}
    >
      <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>
        Payments to verify {payments.length > 0 && <span style={{ color: '#b45309' }}>· {payments.length} pending</span>}
      </h2>
      <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0 0 0.85rem 0' }}>
        Member-submitted payments awaiting your physical verification. Verifying a payment issues the membership certificate automatically.
      </p>

      {error && <p style={{ color: '#991b1b', fontSize: '0.85rem' }}>{error}</p>}

      {payments.length === 0 ? (
        <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>
          No payments awaiting verification.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={th}>Centre</th>
                <th style={th}>Amount</th>
                <th style={th}>Reference</th>
                <th style={th}>Method</th>
                <th style={th}>Submitted</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={td}><strong>{p.centre_name}</strong></td>
                  <td style={td}>{p.currency} {fmtNum(p.amount)}</td>
                  <td style={td}>{p.reference_number}</td>
                  <td style={td}>{p.method.replace('_', ' ')}</td>
                  <td style={td}>{fmtDate(p.payment_date)}</td>
                  <td style={td}>
                    <button onClick={() => verify(p.id)} disabled={busyId !== null} style={verifyBtn}>
                      {busyId === p.id ? 'Verifying…' : 'Verify & issue'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

const th: React.CSSProperties = { padding: '0.5rem 0.6rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }
const td: React.CSSProperties = { padding: '0.55rem 0.6rem', verticalAlign: 'top' }
const verifyBtn: React.CSSProperties = {
  padding: '0.25rem 0.7rem',
  borderRadius: 6,
  border: '1px solid #16a34a',
  background: '#16a34a',
  color: '#fff',
  fontSize: '0.78rem',
  fontWeight: 600,
  cursor: 'pointer'
}
