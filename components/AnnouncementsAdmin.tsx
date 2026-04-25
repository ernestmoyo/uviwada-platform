'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { AdminAnnouncement } from '@/lib/admin-data'

interface AnnouncementsAdminProps {
  announcements: AdminAnnouncement[]
}

export function AnnouncementsAdmin({ announcements }: AnnouncementsAdminProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(announcements.length === 0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const json = (await res.json()) as { error?: string; detail?: string }
        setError(json.detail ?? json.error ?? 'Failed')
        setSubmitting(false)
        return
      }
      ;(e.target as HTMLFormElement).reset()
      setShowForm(false)
      setSubmitting(false)
      router.refresh()
    } catch {
      setError('Network error')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1rem', margin: 0, color: 'var(--muted)' }}>
          {announcements.length} announcement{announcements.length === 1 ? '' : 's'}
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          {showForm ? 'Cancel' : '+ New announcement'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow)', marginBottom: '1.5rem' }}
        >
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title_en">Title (English)</label>
              <input id="title_en" name="title_en" required />
            </div>
            <div className="form-group">
              <label htmlFor="title_sw">Kichwa (Kiswahili)</label>
              <input id="title_sw" name="title_sw" required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="body_en">Body (English)</label>
            <textarea id="body_en" name="body_en" rows={3} required style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'inherit' }} />
          </div>
          <div className="form-group">
            <label htmlFor="body_sw">Maelezo (Kiswahili)</label>
            <textarea id="body_sw" name="body_sw" rows={3} required style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'inherit' }} />
          </div>
          {error && <p style={{ color: 'var(--accent)' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish to all members'}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {announcements.map((a) => (
          <div
            key={a.id}
            style={{
              background: '#fff',
              borderLeft: '3px solid var(--primary)',
              padding: '0.85rem 1rem',
              borderRadius: 6,
              boxShadow: 'var(--shadow)'
            }}
          >
            <strong>{a.title_en}</strong>
            <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: '0.3rem' }}>{a.body_en}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
              {new Date(a.published_at).toLocaleString('en-GB')}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
