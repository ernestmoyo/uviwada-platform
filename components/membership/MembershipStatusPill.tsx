'use client'

import { useEffect, useState } from 'react'

import { isActive, load, type MembershipRecord } from '@/lib/membership'
import { useI18n } from '@/lib/i18n'

interface MembershipStatusPillProps {
  memberId: string
  centreName: string
}

export function MembershipStatusPill({ memberId, centreName }: MembershipStatusPillProps) {
  const { lang } = useI18n()
  const [record, setRecord] = useState<MembershipRecord | null>(null)

  useEffect(() => {
    setRecord(load(memberId, centreName))
  }, [memberId, centreName])

  if (!record) return null

  const active = isActive(record)
  const hasCert = record.certStatus === 'issued'

  let label: string
  let bg: string
  let color: string

  if (hasCert) {
    label = lang === 'sw' ? 'Cheti Kimetolewa' : 'Certificate Issued'
    bg = '#d1fae5'
    color = '#065f46'
  } else if (active) {
    label = lang === 'sw' ? 'Mwanachama Hai' : 'Active Member'
    bg = '#d1fae5'
    color = '#065f46'
  } else if (record.payments.length > 0) {
    label = lang === 'sw' ? 'Malipo Yanahitajika' : 'Payment Due'
    bg = '#fef3c7'
    color = '#92400e'
  } else {
    label = lang === 'sw' ? 'Haijalipiwa' : 'Not Paid'
    bg = '#fee2e2'
    color = '#991b1b'
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.65rem',
        borderRadius: 99,
        fontSize: '0.78rem',
        fontWeight: 600,
        background: bg,
        color,
        letterSpacing: '0.01em'
      }}
    >
      {label}
    </span>
  )
}
