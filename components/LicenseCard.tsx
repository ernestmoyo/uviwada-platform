'use client'

import { useI18n } from '@/lib/i18n'

interface LicenseCardProps {
  status: string
  number: string | null
  expiry: string | null
}

export function LicenseCard({ status, number, expiry }: LicenseCardProps) {
  const { lang } = useI18n()
  const expiryDate = expiry ? new Date(expiry) : null
  const daysToExpiry = expiryDate
    ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  let badgeColour = 'var(--muted)'
  let badgeText = lang === 'sw' ? 'Hali isiyofahamika' : 'Status unknown'
  if (status === 'fully_licensed') {
    if (daysToExpiry !== null && daysToExpiry < 0) {
      badgeColour = 'var(--accent)'
      badgeText = lang === 'sw' ? 'Imekwisha' : 'Expired'
    } else if (daysToExpiry !== null && daysToExpiry <= 30) {
      badgeColour = '#f59e0b'
      badgeText = lang === 'sw' ? `Inakaribia kuisha (${daysToExpiry} siku)` : `Expiring soon (${daysToExpiry} d)`
    } else {
      badgeColour = '#22c55e'
      badgeText = lang === 'sw' ? 'Hai' : 'Active'
    }
  } else if (status === 'pending') {
    badgeColour = '#f59e0b'
    badgeText = lang === 'sw' ? 'Inasubiri' : 'Pending'
  } else if (status === 'expired') {
    badgeColour = 'var(--accent)'
    badgeText = lang === 'sw' ? 'Imekwisha' : 'Expired'
  } else if (status === 'not_applied') {
    badgeColour = 'var(--muted)'
    badgeText = lang === 'sw' ? 'Haijaombwa' : 'Not applied'
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '1.25rem',
        boxShadow: 'var(--shadow)'
      }}
    >
      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {lang === 'sw' ? 'Leseni' : 'License'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
        <span
          style={{
            display: 'inline-block',
            background: badgeColour,
            color: '#fff',
            padding: '0.25rem 0.75rem',
            borderRadius: 999,
            fontSize: '0.78rem',
            fontWeight: 600
          }}
        >
          {badgeText}
        </span>
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text)', marginTop: '0.6rem' }}>
        {number ? (
          <>
            #{number}
            {expiryDate ? ` · ${lang === 'sw' ? 'inakwisha' : 'expires'} ${expiryDate.toLocaleDateString()}` : ''}
          </>
        ) : (
          <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
            {lang === 'sw' ? 'Hakuna nambari ya leseni iliyowekwa' : 'No license number on file'}
          </span>
        )}
      </div>
    </div>
  )
}
