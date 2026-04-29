'use client'

import { useI18n } from '@/lib/i18n'

interface DemoModeBannerProps {
  active: boolean
}

export function DemoModeBanner({ active }: DemoModeBannerProps) {
  const { lang } = useI18n()
  if (!active) return null
  return (
    <div
      style={{
        background: '#fff7ed',
        borderBottom: '1px solid #fed7aa',
        padding: '0.4rem 1.25rem',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: '#9a3412'
      }}
      role="status"
    >
      <strong>{lang === 'sw' ? 'Hali ya Demo' : 'Demo mode'}</strong>
      {' · '}
      {lang === 'sw'
        ? 'Hakuna database iliyounganishwa — data inayotumika ni ya mfano tu.'
        : 'No database connected — showing seeded sample data only.'}
    </div>
  )
}
