'use client'

import { useI18n } from '@/lib/i18n'
import type { PortalAnnouncement } from '@/lib/portal-data'

export function AnnouncementsList({ items }: { items: PortalAnnouncement[] }) {
  const { lang } = useI18n()
  if (items.length === 0) {
    return (
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
        {lang === 'sw' ? 'Hakuna matangazo bado.' : 'No announcements yet.'}
      </p>
    )
  }
  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {items.map((a) => {
        const when = new Date(a.published_at)
        return (
          <div
            key={a.id}
            style={{
              background: '#fff',
              borderLeft: `3px solid ${a.isNew ? '#ef4444' : 'var(--primary)'}`,
              padding: '0.85rem 1rem',
              borderRadius: 6,
              boxShadow: 'var(--shadow)'
            }}
          >
            <strong>{lang === 'sw' ? a.title_sw : a.title_en}</strong>
            {a.isNew && (
              <span style={{ marginLeft: '0.4rem', fontSize: '0.66rem', fontWeight: 700, background: '#ef4444', color: '#fff', borderRadius: 99, padding: '0.05rem 0.4rem', verticalAlign: 'middle' }}>
                {lang === 'sw' ? 'MPYA' : 'NEW'}
              </span>
            )}
            <div style={{ fontSize: '0.85rem', marginTop: '0.3rem', color: 'var(--text)' }}>
              {lang === 'sw' ? a.body_sw : a.body_en}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
              {when.toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
