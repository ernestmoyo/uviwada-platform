'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { useI18n } from '@/lib/i18n'
import { CHECKLIST, DIMENSIONS, ratingFromScore } from '@/lib/quality-checklist'
import type { QualityDimension, QualityRating } from '@/lib/types/database'

async function queueLocally(payload: unknown): Promise<void> {
  if (typeof indexedDB === 'undefined') throw new Error('No IndexedDB')
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('uviwada-sync', 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore('pending-assessments', { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('pending-assessments', 'readwrite')
    tx.objectStore('pending-assessments').add({ payload, queued_at: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export interface AssessmentFormMember {
  id: string
  centre_name: string
  ward: string
}

interface AssessmentFormProps {
  members: AssessmentFormMember[]
  defaultMemberId?: string
  variant?: 'admin' | 'field'
}

export function AssessmentForm({ members, defaultMemberId, variant = 'admin' }: AssessmentFormProps) {
  const { lang } = useI18n()
  const router = useRouter()
  const [memberId, setMemberId] = useState<string>(defaultMemberId ?? members[0]?.id ?? '')
  const [scores, setScores] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const passedCount = useMemo(() => CHECKLIST.filter((it) => scores[it.code]).length, [scores])
  const rating: QualityRating = useMemo(() => ratingFromScore(passedCount), [passedCount])

  // Try to get GPS once on mount (best-effort, no prompt blocking the form)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 8000, enableHighAccuracy: false }
    )
  }, [])

  function toggleAll(dim: QualityDimension, on: boolean) {
    setScores((prev) => {
      const next = { ...prev }
      CHECKLIST.filter((it) => it.dimension === dim).forEach((it) => {
        next[it.code] = on
      })
      return next
    })
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!memberId) {
      setError('Pick a centre first')
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const indicators = CHECKLIST.map((it) => ({
      indicator_code: it.code,
      dimension: it.dimension,
      passed: !!scores[it.code]
    }))

    let photoUrls: string[] = []
    if (photos.length > 0) {
      // Upload photos via the same API route — it'll forward to Supabase Storage.
      const fd = new FormData()
      photos.forEach((p, i) => fd.append(`photo_${i}`, p))
      try {
        const upRes = await fetch('/api/assessments/photos', { method: 'POST', body: fd })
        if (upRes.ok) {
          const json = (await upRes.json()) as { urls?: string[] }
          photoUrls = json.urls ?? []
        }
      } catch {
        // photos are nice-to-have; don't block submission
      }
    }

    const payload = {
      member_id: memberId,
      rating,
      score_total: passedCount,
      score_max: CHECKLIST.length,
      notes: notes || null,
      follow_up_date: followUp || null,
      gps_lat: gps?.lat ?? null,
      gps_lng: gps?.lng ?? null,
      photos: photoUrls,
      indicators,
      source: variant === 'field' ? 'web' : 'web'
    }

    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        queued?: boolean
        message?: string
        error?: string
        detail?: string
      }
      if (!res.ok && res.status !== 202) {
        setError(json.detail ?? json.error ?? 'Failed to save')
        setSubmitting(false)
        return
      }
      if (json.queued) {
        setSuccess(`Saved offline — will sync when online (rating ${rating.toUpperCase()}, ${passedCount}/${CHECKLIST.length}).`)
      } else {
        setSuccess(`Saved — rating ${rating.toUpperCase()} (${passedCount}/${CHECKLIST.length}).`)
      }
      setSubmitting(false)
      setScores({})
      setNotes('')
      setFollowUp('')
      setPhotos([])
      router.refresh()
    } catch {
      // Network gone AND service worker not active — queue manually
      try {
        await queueLocally(payload)
        setSuccess(`Saved offline — will sync when online (rating ${rating.toUpperCase()}, ${passedCount}/${CHECKLIST.length}).`)
        setScores({})
        setNotes('')
        setFollowUp('')
        setPhotos([])
      } catch {
        setError('Network error and offline storage unavailable')
      }
      setSubmitting(false)
    }
  }

  const ratingColour = rating === 'green' ? '#22c55e' : rating === 'amber' ? '#f59e0b' : '#ef4444'

  return (
    <form onSubmit={onSubmit}>
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '1rem 1.25rem',
          boxShadow: 'var(--shadow)',
          marginBottom: '1rem',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '1rem',
          alignItems: 'center'
        }}
      >
        <div>
          <label htmlFor="member_id" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', display: 'block' }}>
            {lang === 'sw' ? 'Kituo' : 'Centre'}
          </label>
          <select
            id="member_id"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            required
            style={{ marginTop: '0.25rem', padding: '0.5rem 0.7rem', border: '1px solid var(--border)', borderRadius: 8, width: '100%', fontSize: '1rem', fontWeight: 600 }}
          >
            <option value="">— pick a centre —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.centre_name} ({m.ward})
              </option>
            ))}
          </select>
        </div>

        <div style={{ textAlign: 'center', minWidth: 120 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: ratingColour,
              margin: '0 auto',
              boxShadow: 'inset 0 0 14px rgba(0,0,0,0.2)'
            }}
          />
          <div style={{ fontWeight: 700, marginTop: '0.4rem', color: ratingColour }}>{rating.toUpperCase()}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            {passedCount} / {CHECKLIST.length}
          </div>
        </div>
      </div>

      {DIMENSIONS.map((dim) => {
        const items = CHECKLIST.filter((it) => it.dimension === dim.code)
        const passedInDim = items.filter((it) => scores[it.code]).length
        return (
          <fieldset
            key={dim.code}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              background: '#fff',
              marginBottom: '1rem'
            }}
          >
            <legend
              style={{
                padding: '0 0.5rem',
                fontWeight: 700,
                color: 'var(--primary-dark)',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}
            >
              <span>{lang === 'sw' ? dim.sw : dim.en}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 500 }}>
                ({passedInDim}/{items.length})
              </span>
              <button
                type="button"
                onClick={() => toggleAll(dim.code, passedInDim < items.length)}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '0.15rem 0.55rem',
                  fontSize: '0.72rem',
                  cursor: 'pointer'
                }}
              >
                {passedInDim < items.length ? 'All ✓' : 'Clear'}
              </button>
            </legend>
            {items.map((it) => (
              <label
                key={it.code}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '0.65rem',
                  padding: '0.4rem 0',
                  fontSize: '0.92rem',
                  alignItems: 'flex-start',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={!!scores[it.code]}
                  onChange={(e) =>
                    setScores((prev) => ({ ...prev, [it.code]: e.target.checked }))
                  }
                  style={{ marginTop: '0.2rem', width: 18, height: 18 }}
                />
                <span>{lang === 'sw' ? it.sw : it.en}</span>
              </label>
            ))}
          </fieldset>
        )
      })}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="notes">Improvement action notes</label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'inherit' }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="follow_up">Follow-up date</label>
          <input
            id="follow_up"
            type="date"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Photos (optional)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
        />
        {photos.length > 0 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
            {photos.length} file{photos.length === 1 ? '' : 's'} selected.
          </p>
        )}
      </div>

      {gps && (
        <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
          GPS captured: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
        </p>
      )}

      {error && <p style={{ color: 'var(--accent)' }}>{error}</p>}
      {success && <p style={{ color: '#22c55e' }}>{success}</p>}

      <button type="submit" className="btn btn-primary btn-full" disabled={submitting} style={{ marginTop: '1rem' }}>
        {submitting ? 'Saving…' : `Save assessment · ${rating.toUpperCase()}`}
      </button>
    </form>
  )
}
