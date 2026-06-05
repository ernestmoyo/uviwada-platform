'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
      const res = await fetch('/api/rubric-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, capacity, infra, comments: comments || null, gps_lat: gps?.lat ?? null, gps_lng: gps?.lng ?? null })
      })
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; tier?: string; error?: string; detail?: string }
      if (!res.ok) {
        setError(json.detail ?? json.error ?? 'Failed to save')
      } else {
        setSuccess(`Saved — ${json.tier ?? 'tier pending'}.`)
        setCapacity({})
        setInfra({})
        setComments('')
        router.refresh()
      }
    } catch {
      setError('Network error — please retry when online.')
    }
    setSubmitting(false)
  }

  return (
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

      {gps && <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>GPS captured: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</p>}
      {error && <p style={{ color: 'var(--accent, #ef4444)' }}>{error}</p>}
      {success && <p style={{ color: '#22c55e' }}>{success}</p>}

      <button type="submit" className="btn btn-primary btn-full" disabled={submitting} style={{ marginTop: '1rem' }}>
        {submitting ? 'Saving…' : tier ? `Save assessment · ${tier.tier}` : 'Save assessment'}
      </button>
    </form>
  )
}

function Section({ title, items, values, setValues, lang, showHints }: { title: string; items: RubricItem[]; values: Levels; setValues: (f: (p: Levels) => Levels) => void; lang: 'sw' | 'en'; showHints?: boolean }) {
  return (
    <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', background: '#fff', marginBottom: '1rem' }}>
      <legend style={{ padding: '0 0.5rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{title}</legend>
      {items.map((it) => (
        <div key={it.key} style={{ padding: '0.5rem 0', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.9rem', marginBottom: '0.35rem' }}>
            {lang === 'sw' ? it.sw : it.en}
            {showHints && it.hint_en && <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--muted)' }}>{it.hint_en}</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {SCORE_LEVELS.map((lvl) => {
              const active = values[it.key] === lvl.value
              return (
                <button
                  key={lvl.value}
                  type="button"
                  onClick={() => setValues((p) => ({ ...p, [it.key]: active ? null : lvl.value }))}
                  title={lang === 'sw' ? lvl.sw : lvl.en}
                  style={{
                    minWidth: 38,
                    padding: '0.3rem 0.5rem',
                    borderRadius: 8,
                    border: active ? `2px solid ${LEVEL_COLOURS[lvl.value]}` : '1px solid #cbd5e1',
                    background: active ? LEVEL_COLOURS[lvl.value] : '#fff',
                    color: active ? '#fff' : '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {lvl.value}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </fieldset>
  )
}
