'use client'

import { useEffect, useState } from 'react'

import { useI18n } from '@/lib/i18n'

interface Card {
  id: string
  age_band: string
  subject: string | null
  title_sw: string
  title_en: string | null
}
interface PlanStep { title: string; detail: string }
interface Plan {
  title: string; age_band: string; theme: string; duration_minutes?: number
  objectives: string[]; materials: string[]; introduction: string
  steps: PlanStep[]; assessment: string; notes?: string
}

const AGE_BANDS = ['2-3', '3-4', '4-5']

export function CurriculumStudio() {
  const { lang } = useI18n()
  const t = (sw: string, en: string) => (lang === 'en' ? en : sw)

  const [ageBand, setAgeBand] = useState('2-3')
  const [theme, setTheme] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<{ id: string; plan: Plan } | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`/api/curriculum?ageBand=${encodeURIComponent(ageBand)}`)
      .then((r) => r.json())
      .then((d) => { if (alive) setCards(d.cards || []) })
      .catch(() => { if (alive) setCards([]) })
    return () => { alive = false }
  }, [ageBand])

  async function generate() {
    if (!theme.trim() || generating) return
    setGenerating(true); setError(null); setPlan(null)
    try {
      const res = await fetch('/api/curriculum/lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ageBand, theme: theme.trim(), lang })
      })
      const d = await res.json()
      if (!res.ok) setError(d.detail || d.error || 'Failed')
      else setPlan({ id: d.id, plan: d.plan })
    } catch {
      setError(t('Hitilafu ya mtandao — jaribu tena.', 'Network error — please retry.'))
    }
    setGenerating(false)
  }

  const cardName = (c: Card) => (lang === 'en' ? c.title_en || c.title_sw : c.title_sw)
  const subjects = Array.from(new Set(cards.map((c) => c.subject).filter(Boolean))) as string[]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: '1.5rem', alignItems: 'start' }}>
      {/* Builder */}
      <div className="portal-form-card" style={{ position: 'sticky', top: 80 }}>
        <h2 style={{ marginTop: 0 }}>{t('Tengeneza andalio la somo', 'Build a lesson plan')}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
          {t('Chagua kundi la umri na mada; AI itaandaa andalio kutoka kwa mtaala rasmi.',
            'Pick an age band and theme; AI drafts a plan from the official curriculum.')}
        </p>

        <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t('Kundi la umri', 'Age band')}</label>
        <div style={{ display: 'flex', gap: '0.5rem', margin: '0.4rem 0 1rem' }}>
          {AGE_BANDS.map((a) => (
            <button key={a} type="button" onClick={() => setAgeBand(a)}
              style={{ flex: 1, padding: '0.5rem', borderRadius: 8, cursor: 'pointer',
                border: ageBand === a ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: ageBand === a ? 'var(--primary)' : '#fff', color: ageBand === a ? '#fff' : 'var(--ink)', fontWeight: 700 }}>
              {a}
            </button>
          ))}
        </div>

        <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t('Mada', 'Theme / topic')}</label>
        <input value={theme} onChange={(e) => setTheme(e.target.value)}
          placeholder={t('mf. Kutambua rangi, Usafi, Wanyama', 'e.g. Colours, Hygiene, Animals')}
          style={{ width: '100%', padding: '0.55rem 0.7rem', border: '1px solid var(--border)', borderRadius: 8, margin: '0.4rem 0 1rem' }} />

        <button onClick={generate} disabled={generating || !theme.trim()} className="btn btn-primary btn-full">
          {generating ? t('Inaandaa…', 'Generating…') : t('Tengeneza andalio', 'Generate lesson plan')}
        </button>
        {error && <p style={{ color: 'var(--accent, #ef4444)', fontSize: '0.85rem', marginTop: '0.75rem' }}>{error}</p>}

        <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
          {cards.length > 0
            ? t(`Kadi ${cards.length} za mtaala kwa umri huu`, `${cards.length} curriculum cards for this age band`)
            : t('Hakuna kadi bado kwa umri huu', 'No curriculum cards yet for this age band')}
          {subjects.length > 0 && <div style={{ marginTop: '0.4rem' }}>{subjects.slice(0, 8).join(' · ')}</div>}
        </div>
      </div>

      {/* Output */}
      <div>
        {!plan ? (
          <div className="portal-form-card" style={{ color: 'var(--muted)' }}>
            {t('Andalio litaonekana hapa. Unaweza kulipakua kama Word.',
              'Your lesson plan will appear here. You can download it as Word.')}
            {cards.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong style={{ fontSize: '0.85rem' }}>{t('Mada zinazopatikana', 'Available topics')}</strong>
                <ul style={{ marginTop: '0.4rem', columns: 2, fontSize: '0.85rem' }}>
                  {cards.slice(0, 16).map((c) => <li key={c.id}>{cardName(c)}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="portal-form-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <h2 style={{ marginTop: 0 }}>{plan.plan.title}</h2>
              <a href={`/api/curriculum/lesson-plan/${plan.id}/docx`} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                {t('Pakua Word', 'Download Word')} ↓
              </a>
            </div>
            <p style={{ color: 'var(--muted)', marginTop: '-0.4rem' }}>
              {plan.plan.age_band} · {plan.plan.theme}{plan.plan.duration_minutes ? ` · ${plan.plan.duration_minutes} min` : ''}
            </p>
            <Section title={t('Malengo', 'Objectives')} items={plan.plan.objectives} />
            <Section title={t('Vifaa', 'Materials')} items={plan.plan.materials} />
            <h3>{t('Utangulizi', 'Introduction')}</h3>
            <p>{plan.plan.introduction}</p>
            <h3>{t('Hatua', 'Steps')}</h3>
            <ol>{plan.plan.steps.map((s, i) => <li key={i} style={{ marginBottom: '0.4rem' }}><strong>{s.title}:</strong> {s.detail}</li>)}</ol>
            <h3>{t('Tathmini', 'Assessment')}</h3>
            <p>{plan.plan.assessment}</p>
            {plan.plan.notes && <><h3>{t('Maelezo', 'Notes')}</h3><p>{plan.plan.notes}</p></>}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null
  return (
    <>
      <h3 style={{ marginBottom: '0.3rem' }}>{title}</h3>
      <ul style={{ marginTop: 0 }}>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
    </>
  )
}
