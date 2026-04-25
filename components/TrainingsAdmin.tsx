'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useI18n } from '@/lib/i18n'
import type { AdminTraining } from '@/lib/admin-data'

interface TrainingsAdminProps {
  trainings: AdminTraining[]
}

const CATEGORY_OPTIONS = [
  { value: 'safeguarding', sw: 'Ulinzi wa Mtoto', en: 'Safeguarding' },
  { value: 'curriculum', sw: 'Mtaala', en: 'Curriculum' },
  { value: 'nutrition', sw: 'Lishe', en: 'Nutrition' },
  { value: 'health_hygiene', sw: 'Afya na Usafi', en: 'Health & Hygiene' },
  { value: 'staffing', sw: 'Wafanyakazi', en: 'Staffing' },
  { value: 'infrastructure', sw: 'Miundombinu', en: 'Infrastructure' }
]

export function TrainingsAdmin({ trainings }: TrainingsAdminProps) {
  const router = useRouter()
  const { lang } = useI18n()
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const json = (await res.json()) as { error?: string; detail?: string }
        setError(json.detail ?? json.error ?? 'Failed to create')
        setSubmitting(false)
        return
      }
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
          {trainings.length} training{trainings.length === 1 ? '' : 's'}
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          {showForm ? 'Cancel' : '+ New training'}
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
              <input id="title_en" name="title_en" required placeholder="e.g. Child Safeguarding Refresher" />
            </div>
            <div className="form-group">
              <label htmlFor="title_sw">Kichwa (Kiswahili)</label>
              <input id="title_sw" name="title_sw" required placeholder="e.g. Ulinzi wa Mtoto - Mafunzo ya Ufuatiliaji" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" required defaultValue="curriculum">
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {lang === 'sw' ? c.sw : c.en}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="scheduled_at">Date &amp; time</label>
              <input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input id="location" name="location" required placeholder="e.g. UVIWADA Hall, Magomeni" />
            </div>
            <div className="form-group">
              <label htmlFor="capacity">Capacity</label>
              <input id="capacity" name="capacity" type="number" min="1" required defaultValue={30} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="facilitator">Facilitator (optional)</label>
            <input id="facilitator" name="facilitator" placeholder="e.g. Dr. Esther Mwakasege" />
          </div>
          {error && <p style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '0.5rem' }}>
            {submitting ? 'Publishing…' : 'Publish training'}
          </button>
        </form>
      )}

      {trainings.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No trainings yet — create the first one.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {trainings.map((t) => {
            const when = new Date(t.scheduled_at)
            const upcoming = when.getTime() > Date.now()
            return (
              <div
                key={t.id}
                style={{
                  background: '#fff',
                  borderLeft: `3px solid ${upcoming ? 'var(--primary)' : 'var(--muted)'}`,
                  padding: '1rem 1.1rem',
                  borderRadius: 6,
                  boxShadow: 'var(--shadow)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '1rem',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong>{t.title_en}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                    {when.toLocaleString('en-GB')} · {t.location} · {t.category}
                    {t.facilitator ? ` · ${t.facilitator}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                    {t.registered_count} / {t.capacity}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    registered
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
