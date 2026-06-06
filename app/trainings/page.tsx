'use client'

import Link from 'next/link'

import { useI18n } from '@/lib/i18n'
import { TRAINING_EVENTS } from '@/lib/training-events'

const CATEGORY_COLORS: Record<string, string> = {
  Safeguarding: '#7c3aed',
  'Ulinzi wa Mtoto': '#7c3aed',
  'Quality Improvement': '#0369a1',
  'Uboreshaji wa Ubora': '#0369a1',
  Nutrition: '#047857',
  Lishe: '#047857',
  'Business Management': '#b45309',
  'Usimamizi wa Biashara': '#b45309',
  'Disability Inclusion': '#be185d',
  'Ujumuishaji wa Ulemavu': '#be185d',
  'Financial Literacy': '#1d4ed8',
  'Elimu ya Fedha': '#1d4ed8',
}

function formatDate(iso: string, sw: boolean): string {
  const d = new Date(iso)
  if (sw) {
    // Swahili month names
    const months = [
      'Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni',
      'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba',
    ]
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function TrainingsPage() {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  return (
    <main style={{ background: 'var(--bg-alt)', minHeight: '100vh' }}>
      {/* Dark header — matches /directory, /quality, /resources chrome */}
      <header style={{ background: 'var(--primary-dark)', color: '#fff', padding: '1.4rem 0' }}>
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: '0.5rem 0.7rem',
                display: 'inline-flex',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/uviwata_logo.png"
                alt="UVIWATA — Mtoto Kwanza"
                style={{ height: 40, width: 'auto', display: 'block' }}
              />
            </span>
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  opacity: 0.75,
                }}
              >
                {sw ? 'UVIWATA · Kalenda ya Mafunzo' : 'UVIWATA · Training Calendar'}
              </div>
              <h1 style={{ fontSize: '1.6rem', margin: '0.25rem 0 0' }}>
                {sw ? 'Ratiba ya Mafunzo Yanayokuja' : 'Upcoming Training Schedule'}
              </h1>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', opacity: 0.85 }}>
                {sw
                  ? 'Mafunzo ya vitendo kwa wamiliki na walezi wa vituo vya malezi — Dar es Salaam.'
                  : 'Practical training for daycare owners and caregivers — Dar es Salaam.'}
              </p>
            </div>
          </div>
          <Link
            href="/"
            style={{
              color: '#fff',
              fontSize: '0.85rem',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.4)',
              padding: '0.45rem 0.9rem',
              borderRadius: 8,
            }}
          >
            ← {sw ? 'Nyumbani' : 'Home'}
          </Link>
        </div>
      </header>

      <section style={{ padding: '1.75rem 0 4rem' }}>
        <div className="container">
          {/* Programme notice */}
          <div className="trn-notice">
            <span className="trn-notice-icon" aria-hidden>📅</span>
            <div>
              <strong>{sw ? 'Mpango wa mfano wa mafunzo' : 'Sample training programme'}</strong>
              <p>
                {sw
                  ? 'Ratiba hii inaonyesha mpango wa mafunzo wa UVIWATA kwa 2026. Tarehe na maeneo yanaweza kubadilika. Usajili utafungua majuma mawili kabla ya kila kipindi.'
                  : 'This schedule shows the UVIWATA training programme for 2026. Dates and venues are subject to change. Registration opens two weeks before each session.'}
              </p>
            </div>
          </div>

          {/* Training cards */}
          <div className="trn-list">
            {TRAINING_EVENTS.map((ev) => {
              const catLabel = sw ? ev.category_sw : ev.category_en
              const catColor = CATEGORY_COLORS[catLabel] ?? 'var(--primary)'
              return (
                <div className="trn-card" key={ev.id}>
                  <div className="trn-card-aside">
                    <div className="trn-date-block">
                      <span className="trn-month">
                        {new Date(ev.date).toLocaleDateString(sw ? 'sw' : 'en-GB', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className="trn-day">{new Date(ev.date).getDate()}</span>
                      <span className="trn-year">{new Date(ev.date).getFullYear()}</span>
                    </div>
                  </div>
                  <div className="trn-card-body">
                    <div className="trn-card-top">
                      <span
                        className="trn-cat-pill"
                        style={{ background: catColor + '1a', color: catColor }}
                      >
                        {catLabel}
                      </span>
                    </div>
                    <h3 className="trn-title">{sw ? ev.title_sw : ev.title_en}</h3>
                    <div className="trn-meta">
                      <span className="trn-meta-item">
                        📅 {formatDate(ev.date, sw)}
                      </span>
                      <span className="trn-meta-item">
                        🕘 {sw ? ev.time_sw : ev.time_en}
                      </span>
                      <span className="trn-meta-item">
                        📍 {sw ? ev.location_sw : ev.location_en}
                      </span>
                    </div>
                    <p className="trn-desc">{sw ? ev.description_sw : ev.description_en}</p>
                    <Link href="/portal/register" className="btn btn-primary trn-register-btn">
                      {sw ? 'Jisajili →' : 'Register →'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer note */}
          <div className="trn-footer-note">
            <p>
              {sw
                ? 'Je, hutapata mafunzo katika eneo lako? Jiunge na UVIWATA na tutakuarifu mafunzo mapya yanapoongezwa.'
                : "Don't see a training near you? Join UVIWATA and we'll notify you when new sessions are added."}
            </p>
            <Link href="/portal/register" className="btn btn-primary" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
              {sw ? 'Jiunge na UVIWATA' : 'Join UVIWATA'}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
