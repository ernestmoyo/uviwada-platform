'use client'

import { useState } from 'react'

import { PaymentForm } from './PaymentForm'

interface MemberOption {
  id: string
  centre_name: string
  ward: string
}

interface PaymentsRecorderProps {
  members: MemberOption[]
  defaultDate: string
}

export function PaymentsRecorder({ members, defaultDate }: PaymentsRecorderProps) {
  const [memberId, setMemberId] = useState('')

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
        Member
      </label>
      <select
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        style={{ width: '100%', maxWidth: 380, padding: '0.5rem 0.65rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', marginBottom: '1.25rem' }}
      >
        <option value="">— Choose a member —</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.ward} · {m.centre_name}
          </option>
        ))}
      </select>

      {memberId ? (
        <PaymentForm key={memberId} memberId={memberId} defaultDate={defaultDate} />
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Pick a member to record a payment.</p>
      )}
    </div>
  )
}
