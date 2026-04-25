'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useI18n } from '@/lib/i18n'
import type { UpcomingTraining } from '@/lib/portal-data'

interface TrainingsListProps {
  trainings: UpcomingTraining[]
}

export function TrainingsList({ trainings }: TrainingsListProps) {
  const { lang } = useI18n()
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function register(trainingId: string) {
    setBusyId(trainingId)
    setError(null)
    try {
      const res = await fetch('/api/trainings/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ training_id: trainingId })
      })
      if (!res.ok) {
        const json = (await res.json()) as { error?: string; detail?: string }
        setError(json.detail ?? json.error ?? 'Failed to register')
        setBusyId(null)
        return
      }
      router.refresh()
      setBusyId(null)
    } catch {
      setError('Network error')
      setBusyId(null)
    }
  }

  if (trainings.length === 0) {
    return (
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
        {lang === 'sw' ? 'Hakuna mafunzo yaliyopangwa kwa sasa.' : 'No upcoming trainings scheduled.'}
      </p>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {error && <p style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{error}</p>}
      {trainings.map((t) => {
        const when = new Date(t.scheduled_at)
        return (
          <div
            key={t.id}
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: '1rem 1.1rem',
              boxShadow: 'var(--shadow)',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '1rem',
              alignItems: 'center'
            }}
          >
            <div>
              <strong>{lang === 'sw' ? t.title_sw : t.title_en}</strong>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                {when.toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
                {' · '}
                {t.location}
                {t.facilitator ? ` · ${t.facilitator}` : ''}
              </div>
            </div>
            {t.registered ? (
              <span
                style={{
                  background: '#22c55e',
                  color: '#fff',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 999,
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                ✓ {lang === 'sw' ? 'Umejisajili' : 'Registered'}
              </span>
            ) : (
              <button
                onClick={() => register(t.id)}
                disabled={busyId !== null}
                className="btn btn-primary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                {busyId === t.id ? '…' : lang === 'sw' ? 'Jisajili' : 'Register'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
