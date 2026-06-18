'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PaymentFormProps {
  memberId: string
  defaultDate: string // YYYY-MM-DD
}

const METHODS = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' }
]

export function PaymentForm({ memberId, defaultDate }: PaymentFormProps) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('TZS')
  const [date, setDate] = useState(defaultDate)
  const [reference, setReference] = useState('')
  const [method, setMethod] = useState('bank_transfer')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      const res = await fetch('/api/members/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          amount,
          currency,
          payment_date: date,
          reference_number: reference,
          method,
          note: note || undefined
        })
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Could not record payment')
        setBusy(false)
        return
      }
      setAmount('')
      setReference('')
      setNote('')
      setDone(true)
      router.refresh()
      setBusy(false)
    } catch {
      setError('Network error — please try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
      <Field label="Amount">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" step="0.01" required style={inp} />
      </Field>
      <Field label="Currency">
        <input value={currency} onChange={(e) => setCurrency(e.target.value)} required style={inp} />
      </Field>
      <Field label="Payment date">
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" required style={inp} />
      </Field>
      <Field label="Reference number">
        <input value={reference} onChange={(e) => setReference(e.target.value)} required placeholder="Required (incl. cash)" style={inp} />
      </Field>
      <Field label="Method">
        <select value={method} onChange={(e) => setMethod(e.target.value)} style={inp}>
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Note (optional)">
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inp} />
      </Field>
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Recording…' : 'Record payment'}
        </button>
        {error && <span style={{ color: '#991b1b', fontSize: '0.85rem' }}>{error}</span>}
        {done && <span style={{ color: '#16a34a', fontSize: '0.85rem' }}>Payment recorded ✓</span>}
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.65rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '0.9rem'
}
