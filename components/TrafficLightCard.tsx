'use client'

import { useI18n } from '@/lib/i18n'
import type { QualityRating } from '@/lib/types/database'

const LABELS: Record<QualityRating | 'none', { sw: string; en: string }> = {
  green: { sw: 'Ubora Mzuri', en: 'Good Quality' },
  amber: { sw: 'Unahitaji Kuboresha', en: 'Needs Improvement' },
  red: { sw: 'Chini ya Kiwango', en: 'Below Standard' },
  none: { sw: 'Bado haijatathminiwa', en: 'Not yet assessed' }
}

const COLOURS = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  none: '#94a3b8'
}

export function TrafficLightCard({ rating }: { rating: QualityRating | null }) {
  const { lang } = useI18n()
  const key = rating ?? 'none'
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '1.25rem',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: COLOURS[key],
          flexShrink: 0,
          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.18)'
        }}
      />
      <div>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {lang === 'sw' ? 'Ubora wa Sasa' : 'Current Quality'}
        </div>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
          {LABELS[key][lang]}
        </div>
      </div>
    </div>
  )
}
