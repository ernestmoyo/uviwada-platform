'use client'

import { useCallback, useEffect, useState } from 'react'

import { useI18n } from '@/lib/i18n'

interface MembershipStatusPillProps {
  memberId: string
  centreName: string
}

type PayStatus = 'pending' | 'verified' | 'rejected'
type CertStatus = 'none' | 'requested' | 'issued' | 'revoked'

/**
 * Top-of-portal membership status badge.
 *
 * Reads the REAL workflow state from the platform APIs (member_payments +
 * certificates) — the same source the /portal/membership panel uses — so the
 * badge advances through the actual stages (payment → pending review →
 * verified/active → certificate issued) instead of a per-device store that the
 * workflow never wrote to. Re-checks on focus and polls every 15s until the
 * certificate is issued, so the secretariat's verification shows up without a
 * manual refresh.
 */
export function MembershipStatusPill(_props: MembershipStatusPillProps) {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [payStatus, setPayStatus] = useState<PayStatus | null>(null)
  const [certStatus, setCertStatus] = useState<CertStatus>('none')
  const [ready, setReady] = useState(false)

  const load = useCallback(async () => {
    const [pr, cr] = await Promise.all([
      fetch('/api/members/payments', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : { payment: null }))
        .catch(() => ({ payment: null })),
      fetch('/api/members/certificate', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : { status: 'none' }))
        .catch(() => ({ status: 'none' }))
    ])
    setPayStatus((pr.payment?.status as PayStatus | undefined) ?? null)
    setCertStatus((cr.status as CertStatus | undefined) ?? 'none')
    setReady(true)
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void load() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    const id = certStatus === 'issued' ? undefined : setInterval(refresh, 15000)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      if (id) clearInterval(id)
    }
  }, [load, certStatus])

  if (!ready) return null

  let label: string
  let bg: string
  let color: string

  if (certStatus === 'issued') {
    label = sw ? 'Cheti Kimetolewa' : 'Certificate Issued'
    bg = '#d1fae5'
    color = '#065f46'
  } else if (payStatus === 'verified') {
    label = sw ? 'Mwanachama Hai' : 'Active Member'
    bg = '#d1fae5'
    color = '#065f46'
  } else if (payStatus === 'pending') {
    label = sw ? 'Malipo yanasubiri uhakiki' : 'Payment pending review'
    bg = '#fef3c7'
    color = '#92400e'
  } else if (payStatus === 'rejected') {
    label = sw ? 'Malipo yamekataliwa' : 'Payment rejected'
    bg = '#fee2e2'
    color = '#991b1b'
  } else {
    label = sw ? 'Haijalipiwa' : 'Not Paid'
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
