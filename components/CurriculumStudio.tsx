'use client'

import { useEffect, useRef, useState } from 'react'

import { useI18n } from '@/lib/i18n'
import { VisualAids } from '@/components/curriculum/VisualAids'
import type { VisualAid } from '@/lib/curriculum'

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
  visual_aids?: VisualAid[]
}

const AGE_BANDS = ['2-3', '3-4', '4-5']

// Tanzania flag palette — used as accents over the app's blue/red brand.
const TZ = { green: '#1EB53A', gold: '#FCD116', blue: '#00A3DD', black: '#231F20' }

// Suggested term-by-term theme progression (a planning guide drawn from the
// curriculum's recurring early-childhood themes — not fixed calendar dates).
const TERMS: Array<{ sw: string; en: string; monSw: string; monEn: string; color: string; themes: Array<{ sw: string; en: string }> }> = [
  {
    sw: 'Muhula wa Kwanza', en: 'Term One', monSw: 'Januari – Aprili', monEn: 'January – April', color: TZ.green,
    themes: [
      { sw: 'Mimi na familia yangu', en: 'Me and my family' },
      { sw: 'Mwili wangu', en: 'My body' },
      { sw: 'Usafi na afya', en: 'Hygiene & health' },
      { sw: 'Rangi na maumbo', en: 'Colours & shapes' }
    ]
  },
  {
    sw: 'Muhula wa Pili', en: 'Term Two', monSw: 'Mei – Agosti', monEn: 'May – August', color: TZ.blue,
    themes: [
      { sw: 'Nyumbani kwangu', en: 'My home' },
      { sw: 'Chakula na lishe', en: 'Food & nutrition' },
      { sw: 'Wanyama', en: 'Animals' },
      { sw: 'Hesabu na namba', en: 'Counting & numbers' }
    ]
  },
  {
    sw: 'Muhula wa Tatu', en: 'Term Three', monSw: 'Septemba – Desemba', monEn: 'September – December', color: TZ.gold,
    themes: [
      { sw: 'Mazingira yangu', en: 'My environment' },
      { sw: 'Maji na hali ya hewa', en: 'Water & weather' },
      { sw: 'Wasaidizi katika jamii', en: 'Community helpers' },
      { sw: 'Usalama', en: 'Safety' }
    ]
  }
]

export function CurriculumStudio() {
  const { lang } = useI18n()
  const t = (sw: string, en: string) => (lang === 'en' ? en : sw)

  const [ageBand, setAgeBand] = useState('2-3')
  const [theme, setTheme] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<{ id: string; plan: Plan } | null>(null)
  const builderRef = useRef<HTMLDivElement>(null)
  const themeRef = useRef<HTMLInputElement>(null)

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

  function pickTheme(value: string) {
    setTheme(value)
    builderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => themeRef.current?.focus(), 350)
  }

  const cardName = (c: Card) => (lang === 'en' ? c.title_en || c.title_sw : c.title_sw)
  const subjects = Array.from(new Set(cards.map((c) => c.subject).filter(Boolean))) as string[]

  return (
    <>
      {/* Branded hero — Coat of Arms + UVIWATA logo + Government attribution */}
      <BrandHero t={t} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Builder */}
        <div ref={builderRef} className="portal-form-card" style={{ position: 'sticky', top: 80, borderTop: `4px solid ${TZ.green}` }}>
          <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden style={{ fontSize: '1.2rem' }}>✨</span>
            {t('Tengeneza andalio la somo', 'Build a lesson plan')}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '-0.3rem' }}>
            {t('Chagua kundi la umri na mada; AI itaandaa andalio kutoka kwa mtaala rasmi.',
              'Pick an age band and theme; AI drafts a plan from the official curriculum.')}
          </p>

          <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t('Kundi la umri', 'Age band')}</label>
          <div style={{ display: 'flex', gap: '0.5rem', margin: '0.4rem 0 1rem' }}>
            {AGE_BANDS.map((a) => (
              <button key={a} type="button" onClick={() => setAgeBand(a)}
                style={{
                  flex: 1, padding: '0.55rem', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
                  border: ageBand === a ? `2px solid ${TZ.green}` : '1px solid var(--border)',
                  background: ageBand === a ? TZ.green : '#fff', color: ageBand === a ? '#fff' : 'var(--ink, #1f2937)', fontWeight: 700
                }}>
                {a}
              </button>
            ))}
          </div>

          <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t('Mada', 'Theme / topic')}</label>
          <input ref={themeRef} value={theme} onChange={(e) => setTheme(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') generate() }}
            placeholder={t('mf. Kutambua rangi, Usafi, Wanyama', 'e.g. Colours, Hygiene, Animals')}
            style={{ width: '100%', padding: '0.6rem 0.7rem', border: '1px solid var(--border)', borderRadius: 8, margin: '0.4rem 0 1rem', fontSize: '0.95rem' }} />

          <button onClick={generate} disabled={generating || !theme.trim()}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: 10, border: 'none', cursor: generating || !theme.trim() ? 'not-allowed' : 'pointer',
              background: generating || !theme.trim() ? '#9ca3af' : `linear-gradient(135deg, ${TZ.green}, #15923a)`,
              color: '#fff', fontWeight: 800, fontSize: '0.98rem', boxShadow: '0 4px 14px rgba(30,181,58,0.25)'
            }}>
            {generating ? t('Inaandaa…', 'Generating…') : t('Tengeneza andalio →', 'Generate lesson plan →')}
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
              <div style={{ fontSize: '0.95rem', color: 'var(--ink, #1f2937)', fontWeight: 600, marginBottom: '0.3rem' }}>
                {t('Andalio lako litaonekana hapa', 'Your lesson plan will appear here')}
              </div>
              {t('Litakuwa na malengo, vifaa, hatua na tathmini — tayari kupakua kama Word yenye nembo rasmi.',
                'It will include objectives, materials, steps and assessment — ready to download as a branded Word document.')}
              {cards.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--ink, #1f2937)' }}>{t('Mada zinazopatikana', 'Available topics')}</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {cards.slice(0, 14).map((c) => (
                      <button key={c.id} type="button" onClick={() => pickTheme(cardName(c))}
                        style={{ border: '1px solid var(--border)', background: '#fff', borderRadius: 20, padding: '0.3rem 0.7rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--primary)' }}>
                        {cardName(c)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <PlanView plan={plan.plan} id={plan.id} t={t} lang={lang} />
          )}
        </div>
      </div>

      {/* Term planner */}
      <TermPlanner t={t} lang={lang} onPick={pickTheme} />
    </>
  )
}

function BrandHero({ t }: { t: (sw: string, en: string) => string }) {
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: '1.5rem', background: '#fff' }}>
      {/* Tanzania flag accent bar */}
      <div style={{ display: 'flex', height: 6 }}>
        <span style={{ flex: 1, background: TZ.green }} />
        <span style={{ flex: 1, background: TZ.gold }} />
        <span style={{ flex: 1, background: TZ.black }} />
        <span style={{ flex: 1, background: TZ.blue }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.1rem 1.4rem', flexWrap: 'wrap' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tz-coat-of-arms.png" alt={t('Nembo ya Taifa', 'Coat of Arms')} style={{ height: 64, width: 'auto' }} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)', lineHeight: 1.2 }}>
            {t('Mtaala & Andalio la Somo', 'Curriculum & Lesson Plans')}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.25rem', maxWidth: 560 }}>
            {t('Mtaala rasmi wa Serikali ya Jamhuri ya Muungano wa Tanzania — Wizara ya Maendeleo ya Jamii, Jinsia, Wanawake na Makundi Maalum.',
              'Official curriculum of the Government of the United Republic of Tanzania — Ministry of Community Development, Gender, Women and Special Groups.')}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/uviwata_logo.png" alt="UVIWATA" style={{ height: 44, width: 'auto' }} />
      </div>
    </div>
  )
}

const SECTIONS: Array<{ key: keyof Plan; sw: string; en: string; color: string; icon: string }> = [
  { key: 'objectives', sw: 'Malengo', en: 'Objectives', color: TZ.green, icon: '🎯' },
  { key: 'materials', sw: 'Vifaa', en: 'Materials', color: TZ.blue, icon: '🧺' },
  { key: 'introduction', sw: 'Utangulizi', en: 'Introduction', color: '#1A5FAA', icon: '📖' },
  { key: 'steps', sw: 'Hatua', en: 'Steps', color: TZ.gold, icon: '🪜' },
  { key: 'assessment', sw: 'Tathmini', en: 'Assessment', color: '#D42027', icon: '✅' },
  { key: 'notes', sw: 'Maelezo', en: 'Notes', color: 'var(--muted)', icon: '📝' }
]

function PlanView({ plan, id, t, lang }: { plan: Plan; id: string; t: (sw: string, en: string) => string; lang: 'sw' | 'en' }) {
  return (
    <div className="portal-form-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Title band */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', color: '#fff', padding: '1.1rem 1.3rem', borderBottom: `4px solid ${TZ.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>{plan.title}</h2>
            <div style={{ fontSize: '0.85rem', opacity: 0.92, marginTop: '0.25rem' }}>
              {t('Umri', 'Age')} {plan.age_band} · {plan.theme}{plan.duration_minutes ? ` · ${plan.duration_minutes} min` : ''}
            </div>
          </div>
          <a href={`/api/curriculum/lesson-plan/${id}/docx`}
            style={{ whiteSpace: 'nowrap', background: TZ.green, color: '#fff', fontWeight: 800, padding: '0.55rem 1rem', borderRadius: 10, textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}>
            ↓ {t('Pakua Word', 'Download Word')}
          </a>
        </div>
      </div>

      <div style={{ padding: '1.2rem 1.3rem' }}>
        {SECTIONS.map((s) => {
          const val = plan[s.key]
          if (s.key === 'steps') {
            if (!plan.steps?.length) return null
            return (
              <Block key={s.key} title={t(s.sw, s.en)} color={s.color} icon={s.icon}>
                <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  {plan.steps.map((st, i) => (
                    <li key={i} style={{ marginBottom: '0.45rem' }}>
                      <strong style={{ color: 'var(--primary-dark)' }}>{st.title}:</strong> {st.detail}
                    </li>
                  ))}
                </ol>
              </Block>
            )
          }
          if (Array.isArray(val)) {
            const items = (val as string[]).filter((it) => typeof it === 'string')
            if (!items.length) return null
            return (
              <Block key={s.key} title={t(s.sw, s.en)} color={s.color} icon={s.icon}>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>{items.map((it, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{it}</li>)}</ul>
              </Block>
            )
          }
          if (typeof val === 'string' && val.trim()) {
            return (
              <Block key={s.key} title={t(s.sw, s.en)} color={s.color} icon={s.icon}>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{val}</p>
              </Block>
            )
          }
          return null
        })}
        <VisualAids aids={plan.visual_aids} lang={lang} />
      </div>
    </div>
  )
}

function Block({ title, color, icon, children }: { title: string; color: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ borderLeft: `4px solid ${color}`, background: 'var(--bg-alt, #f5f8fc)', borderRadius: 10, padding: '0.85rem 1.05rem', marginBottom: '0.85rem' }}>
      <h3 style={{ margin: '0 0 0.5rem', color, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.01em' }}>
        <span aria-hidden>{icon}</span>{title}
      </h3>
      <div style={{ fontSize: '0.92rem', color: 'var(--ink, #1f2937)' }}>{children}</div>
    </div>
  )
}

function TermPlanner({ t, lang, onPick }: { t: (sw: string, en: string) => string; lang: string; onPick: (v: string) => void }) {
  return (
    <section style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.4rem' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{t('Kalenda ya Mihula', 'Term calendar')}</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('mwongozo wa kupanga mwaka', 'a year-planning guide')}</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 0, maxWidth: 720 }}>
        {t('Bofya mada yoyote ili kuijaza kwenye andalio hapo juu, kisha bonyeza “Tengeneza andalio”.',
          'Click any theme to load it into the builder above, then press “Generate lesson plan”.')}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {TERMS.map((term, ti) => (
          <div key={ti} className="portal-form-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: term.color, color: term.color === TZ.gold ? '#231F20' : '#fff', padding: '0.7rem 1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>{lang === 'en' ? term.en : term.sw}</div>
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>{lang === 'en' ? term.monEn : term.monSw}</div>
            </div>
            <div style={{ padding: '0.8rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {term.themes.map((th, i) => {
                const label = lang === 'en' ? th.en : th.sw
                return (
                  <button key={i} type="button" onClick={() => onPick(label)}
                    style={{ textAlign: 'left', border: '1px solid var(--border)', background: '#fff', borderRadius: 8, padding: '0.5rem 0.7rem', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: term.color, flexShrink: 0 }} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
