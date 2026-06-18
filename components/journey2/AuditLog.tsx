import type { StatusLogEntry } from '@/lib/journey2-data'
import { fmtDateTime } from '@/lib/format'

interface AuditLogProps {
  title: string
  entries: StatusLogEntry[]
}

export function AuditLog({ title, entries }: AuditLogProps) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
      <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.85rem 0' }}>{title}</h3>
      {entries.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>No changes recorded yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.6rem' }}>
          {entries.map((e) => (
            <li key={e.id} style={{ borderLeft: '2px solid var(--border)', paddingLeft: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem' }}>
                <strong>{e.from_status ?? '—'}</strong> → <strong>{e.to_status}</strong>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                {fmtDateTime(e.created_at)} · {e.actor_name ?? 'system'}
              </div>
              {e.note && <div style={{ fontSize: '0.82rem', marginTop: '0.2rem', fontStyle: 'italic' }}>“{e.note}”</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
