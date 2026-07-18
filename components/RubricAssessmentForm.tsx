'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { AiRecommendations } from '@/components/AiRecommendations'
import { useI18n } from '@/lib/i18n'
import {
  CAPACITY_COMPETENCIES,
  INFRA_SUBDOMAINS,
  SCORE_LEVELS,
  meanLevel,
  levelToScore,
  tierForScore,
  type RubricItem,
  type RubricLevel
} from '@/lib/rubric'
import { RUBRIC_LEVELS } from '@/lib/rubric-levels'

export interface RubricFormMember {
  id: string
  centre_name: string
  ward: string
}

type Levels = Record<string, RubricLevel | null>
const LEVEL_COLOURS: Record<number, string> = { 1: '#ef4444', 2: '#f59e0b', 3: '#84cc16', 4: '#22c55e' }

export function RubricAssessmentForm({ members, defaultMemberId }: { members: RubricFormMember[]; defaultMemberId?: string }) {
  const { lang } = useI18n()
  const router = useRouter()
  const [memberId, setMemberId] = useState(defaultMemberId ?? members[0]?.id ?? '')
  const [capacity, setCapacity] = useState<Levels>({})
  const [infra, setInfra] = useState<Levels>({})
  const [comments, setComments] = useState('')
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [savedMemberId, setSavedMemberId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 8000, enableHighAccuracy: false }
    )
  }, [])

  const infraMean = useMemo(() => meanLevel(INFRA_SUBDOMAINS.map((d) => infra[d.key])), [infra])
  const capMean = useMemo(() => meanLevel(CAPACITY_COMPETENCIES.map((d) => capacity[d.key])), [capacity])
  const tier = useMemo(() => (infraMean == null ? null : tierForScore(levelToScore(infraMean))), [infraMean])
  const capDone = CAPACITY_COMPETENCIES.filter((d) => capacity[d.key]).length
  const infraDone = INFRA_SUBDOMAINS.filter((d) => infra[d.key]).length

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!memberId) return setError('Pick a centre first')
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      // Upload any captured photos first; collect their public URLs.
      let photo_urls: string[] = []
      if (photos.length) {
        const fd = new FormData()
        photos.forEach((p, i) => fd.append(`photo_${i}`, p))
        const up = await fetch('/api/assessments/photos', { method: 'POST', body: fd })
        if (up.ok) {
          const uj = (await up.json().catch(() => ({}))) as { urls?: string[] }
          photo_urls = uj.urls ?? []
        }
      }
      const res = await fetch('/api/rubric-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, capacity, infra, comments: comments || null, gps_lat: gps?.lat ?? null, gps_lng: gps?.lng ?? null, photo_urls })
      })
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; tier?: string; error?: string; detail?: string }
      if (!res.ok) {
        setError(json.detail ?? json.error ?? 'Failed to save')
      } else {
        setSuccess(`Saved — ${json.tier ?? 'tier pending'}.`)
        setSavedMemberId(memberId)
        setCapacity({})
        setInfra({})
        setComments('')
        setPhotos([])
        router.refresh()
      }
    } catch {
      setError('Network error — please retry when online.')
    }
    setSubmitting(false)
  }

  return (
   <>
    <form onSubmit={onSubmit}>
      {/* header: centre + live tier */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '1rem 1.25rem', boxShadow: 'var(--shadow)', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
        <div>
          <label htmlFor="member_id" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', display: 'block' }}>
            {lang === 'sw' ? 'Kituo' : 'Centre'}
          </label>
          <select id="member_id" value={memberId} onChange={(e) => setMemberId(e.target.value)} required style={{ marginTop: '0.25rem', padding: '0.5rem 0.7rem', border: '1px solid var(--border)', borderRadius: 8, width: '100%', fontSize: '1rem', fontWeight: 600 }}>
            <option value="">— pick a centre —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.centre_name} ({m.ward})</option>
            ))}
          </select>
          <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
            Capacity {capDone}/{CAPACITY_COMPETENCIES.length} · Infrastructure {infraDone}/{INFRA_SUBDOMAINS.length}
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 150 }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: tier ? tier.traffic === 'green' ? '#22c55e' : tier.traffic === 'amber' ? '#f59e0b' : '#ef4444' : 'var(--muted)' }}>
            {tier ? tier.tier : '—'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
            infra {infraMean == null ? '—' : levelToScore(infraMean)}/100 · cap {capMean == null ? '—' : levelToScore(capMean)}/100
          </div>
        </div>
      </div>

      <Section title={lang === 'sw' ? 'Uwezo wa Walezi (1–4)' : 'Careworker Capacity (1–4)'} items={CAPACITY_COMPETENCIES} values={capacity} setValues={setCapacity} lang={lang} />
      <Section title={lang === 'sw' ? 'Miundombinu (Ngazi 1–4)' : 'Infrastructure (Level 1–4)'} items={INFRA_SUBDOMAINS} values={infra} setValues={setInfra} lang={lang} showHints />

      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label htmlFor="comments">{lang === 'sw' ? 'Maoni ya mtathmini' : 'Assessor comments'}</label>
        <textarea id="comments" rows={3} value={comments} onChange={(e) => setComments(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'inherit' }} />
      </div>

      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label htmlFor="photos">{lang === 'sw' ? 'Picha za kituo' : 'Centre photos'}</label>
        <input
          id="photos"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
          style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.9rem' }}
        />
        <p style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
          {photos.length > 0
            ? (lang === 'sw' ? `Picha ${photos.length} zimechaguliwa` : `${photos.length} photo(s) selected`)
            : (lang === 'sw' ? 'Piga picha ya jengo (hiari)' : 'Capture a photo of the premises (optional)')}
        </p>
      </div>

      {gps && <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>GPS captured: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</p>}
      {error && <p style={{ color: 'var(--accent, #ef4444)' }}>{error}</p>}
      {success && <p style={{ color: '#22c55e' }}>{success}</p>}

      <button type="submit" className="btn btn-primary btn-full" disabled={submitting} style={{ marginTop: '1rem' }}>
        {submitting ? 'Saving…' : tier ? `Save assessment · ${tier.tier}` : 'Save assessment'}
      </button>
    </form>
    {savedMemberId && <AiRecommendations memberId={savedMemberId} centreName={members.find((m) => m.id === savedMemberId)?.centre_name} />}
   </>
  )
}

function Section({ title, items, values, setValues, lang, showHints }: { title: string; items: RubricItem[]; values: Levels; setValues: (f: (p: Levels) => Levels) => void; lang: 'sw' | 'en'; showHints?: boolean }) {
  return (
    <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', background: '#fff', marginBottom: '1rem' }}>
      <legend style={{ padding: '0 0.5rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{title}</legend>
      {items.map((it) => (
        <div key={it.key} style={{ padding: '0.6rem 0', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.45rem' }}>
            {lang === 'sw' ? it.sw : it.en}
            {showHints && it.hint_en && <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 400 }}>{it.hint_en}</span>}
          </div>
          {/* Vertical Level 1–4 picker: each level shows a short descriptor so the
              assessor knows exactly what the rating means before assigning it. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {SCORE_LEVELS.map((lvl) => {
              const active = values[it.key] === lvl.value
              const desc = RUBRIC_LEVELS[it.key]?.[lvl.value]
              const text = desc ? (lang === 'sw' ? desc.sw || desc.en : desc.en) : (lang === 'sw' ? lvl.sw : lvl.en)
              const colour = LEVEL_COLOURS[lvl.value]
              return (
                <button
                  key={lvl.value}
                  type="button"
                  onClick={() => setValues((p) => ({ ...p, [it.key]: active ? null : lvl.value }))}
                  aria-pressed={active}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.45rem 0.6rem',
                    borderRadius: 8,
                    border: active ? `2px solid ${colour}` : '1px solid #e2e8f0',
                    background: active ? `${colour}14` : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <span
                    style={{
                      flex: '0 0 auto',
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      background: active ? colour : '#f1f5f9',
                      color: active ? '#fff' : '#475569'
                    }}
                  >
                    {lvl.value}
                  </span>
                  <span style={{ fontSize: '0.8rem', lineHeight: 1.35, color: active ? '#0f172a' : '#475569' }}>{text}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </fieldset>
  )
}
