'use client'

import { useI18n } from '@/lib/i18n'

// "The Equity & Impact Case" — donor-facing section for the Conrad N. Hilton
// Foundation. All figures are drawn verbatim from two verified sources:
//   • Children in Crossfire — Baseline (2025): "Status of Childcare in
//     High-Density & Low-Income Areas of Dar es Salaam"
//   • MVC Childcare Study (2025): "Daycare Access Among Most-Vulnerable Children"
//   • TDHS 2022
// Do NOT alter the numbers — they are cited and will be cross-checked by donors.

const HEADLINE_STATS = [
  {
    value: '82%',
    accent: true,
    en_label: 'of daycare centres are unregistered',
    sw_label: 'ya vituo vya malezi havijasajiliwa',
    en_note: 'the current pass/fail system has already failed',
    sw_note: 'mfumo wa sasa wa kufaulu/kufeli tayari umeshindwa',
  },
  {
    value: '8%',
    accent: false,
    en_label: 'share of enrolled children who are most-vulnerable (MVC)',
    sw_label: 'ya watoto waliowekwa ambao ni wenye mazingira hatari zaidi (MVC)',
    en_note: 'the system as-is leaves the most vulnerable behind',
    sw_note: 'mfumo wa sasa unaacha nyuma wale wanaohitaji zaidi',
  },
  {
    value: '50% vs 30%',
    accent: false,
    en_label: 'children aged 36–59 months developmentally on track: enrolled vs not enrolled in daycare',
    sw_label: 'ya watoto wenye umri wa miaka 3–5 wanaoendelea vyema kimaendeleo: waliowekwa vs wasio kwenye malezi',
    en_note: "daycare is the single biggest lever on Tanzania's human capital",
    sw_note: 'malezi ya watoto ni nguzo kubwa zaidi ya mtaji wa binadamu Tanzania',
  },
]

const EQUITY_CHIPS = [
  {
    en: '13.8% of children with a disability are enrolled vs 42.4% without — disability cuts enrolment odds ~5×',
    sw: 'Asilimia 13.8 ya watoto wenye ulemavu wamewekwa ikilinganishwa na 42.4% wasio na ulemavu — ulemavu hupunguza nafasi za kuandikishwa ~mara 5',
  },
  {
    en: 'Cost is the #1 barrier: monthly fee US$ 6–10, while 73% of high-density caregivers earn US$ 0.40–2.50/day',
    sw: 'Gharama ndiyo kikwazo #1: ada ya kila mwezi US$ 6–10, wakati 73% ya walezi wa maeneo ya msongamano wanaingiza US$ 0.40–2.50/siku',
  },
  {
    en: 'Up to 60% of MVC children in high-density Dar miss out on daycare entirely',
    sw: 'Hadi 60% ya watoto wa MVC katika maeneo ya msongamano wa Dar hawapati malezi kabisa',
  },
]

const DIVIDEND_CHIPS = [
  {
    value: '32%',
    en: 'reported a change in employment status',
    sw: 'waliripoti mabadiliko ya hali ya ajira',
  },
  {
    value: '25.5%',
    en: 'went from jobless to working',
    sw: 'walibadilika kutoka wasio na kazi hadi kuwa wafanyakazi',
  },
  {
    value: '31.1%',
    en: 'reported reduced stress / improved wellbeing',
    sw: 'waliripoti kupungua kwa msongo wa mawazo / kuimarika kwa ustawi',
  },
]

export function ImpactCase() {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  return (
    <section className="section" id="impact-case">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{sw ? 'Athari' : 'Impact'}</span>
          <h2>
            {sw
              ? 'Kwa nini ni muhimu: usawa na athari'
              : 'Why this matters: the equity & impact case'}
          </h2>
          <p className="section-desc">
            {sw
              ? 'Takwimu tatu zinaelezea hali halisi — na fursa kubwa — ya malezi ya watoto nchini Tanzania.'
              : 'Three numbers define the reality — and the opportunity — of childcare in Tanzania.'}
          </p>
        </div>

        {/* Headline stat blocks */}
        <div className="ic-headline-grid">
          {HEADLINE_STATS.map((s) => (
            <div
              key={s.value}
              className={`ic-headline-card${s.accent ? ' ic-headline-accent' : ''}`}
            >
              <span className="ic-big-num">{s.value}</span>
              <p className="ic-big-label">{sw ? s.sw_label : s.en_label}</p>
              <p className="ic-big-note">"{sw ? s.sw_note : s.en_note}"</p>
            </div>
          ))}
        </div>

        {/* Equity row */}
        <div className="ic-row-block">
          <div className="ic-row-head">
            <span className="ic-row-tag">{sw ? 'Usawa' : 'Equity'}</span>
            <p className="ic-row-desc">
              {sw
                ? 'Nani anabaki nyuma — na kwa nini'
                : 'Who gets left behind — and why'}
            </p>
          </div>
          <div className="ic-chips">
            {EQUITY_CHIPS.map((c, i) => (
              <div className="ic-chip ic-chip-equity" key={i}>
                {sw ? c.sw : c.en}
              </div>
            ))}
          </div>
        </div>

        {/* Triple dividend row */}
        <div className="ic-row-block">
          <div className="ic-row-head">
            <span className="ic-row-tag ic-row-tag-green">
              {sw ? 'Faida Tatu' : 'Triple Dividend'}
            </span>
            <p className="ic-row-desc">
              {sw
                ? 'Kati ya walezi walio hatarini ambao watoto wao walipata malezi'
                : 'Among vulnerable caregivers whose child gained daycare access'}
            </p>
          </div>
          <div className="ic-chips ic-chips-dividend">
            {DIVIDEND_CHIPS.map((d) => (
              <div className="ic-chip ic-chip-dividend" key={d.value}>
                <span className="ic-chip-num">{d.value}</span>
                <span className="ic-chip-lbl">{sw ? d.sw : d.en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Source line */}
        <p className="ic-source">
          {sw ? 'Chanzo: ' : 'Source: '}
          Children in Crossfire — Baseline (2025) &amp; MVC Childcare Study (2025); TDHS 2022.
        </p>
      </div>
    </section>
  )
}
