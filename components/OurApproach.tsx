'use client'

import { useI18n } from '@/lib/i18n'

// "Our Approach" — translates the CiC PRIMER Quality Standards narrative onto
// the platform: the move from a binary pass/fail regime (which pushes
// vulnerable children into invisible, riskier care) to a progressive,
// supportive, stepping-stone pathway, scaled through digitalisation.
//
// Sector facts are drawn from the Children in Crossfire baseline study
// ("Status of Childcare in High-Density & Low-Income Areas of Dar es Salaam")
// and the Dar Urban Childcare Study (2023) — cited, never invented.

const PERSONAS = [
  {
    icon: '👩🏿',
    name: 'Amina',
    sw_role: 'Mzazi · mfanyakazi wa kawaida',
    en_role: 'Parent · casual market worker',
    sw: 'Kituo cha karibu kinapofungwa ghafla, analazimika kumwacha mtoto kwa jirani — bila usimamizi, mazingira salama, wala malezi.',
    en: 'When the nearby centre is suddenly closed, she must leave her child with a neighbour — unsupervised, unsafe, without structured care.'
  },
  {
    icon: '👩🏿‍🏫',
    name: 'Madam Esther',
    sw_role: 'Mmiliki wa kituo · miaka 8',
    en_role: 'Centre owner · 8 years',
    sw: 'Kutendewa sawa na kila kituo kunadhoofisha motisha na kunazuia uboreshaji wa hali ya juu.',
    en: 'Being treated the same as every other centre weakens motivation and stalls advanced quality improvement.'
  },
  {
    icon: '👨🏿‍💼',
    name: 'Joseph',
    sw_role: 'Afisa Ustawi wa Jamii (SWO)',
    en_role: 'Social Welfare Officer',
    sw: 'Anasimamia vituo zaidi ya 100. Vipimo vilivyorahisishwa kupita kiasi vinamfanya azime kutatua matatizo badala ya kujenga uwezo.',
    en: 'He monitors 100+ centres. Oversimplified metrics trap him in reactive fire-fighting instead of proactive capacity-building.'
  }
]

const FACTS = [
  { value: '72%', sw: 'vya vituo vimeanzishwa muongo mmoja uliopita', en: 'of centres established in the last decade' },
  { value: '90%', sw: 'vinamilikiwa na watu binafsi', en: 'are privately owned' },
  { value: '>80%', sw: 'ya wafanyakazi ni wanawake', en: 'of the workforce are women' },
  { value: '82%', sw: 'bado havijasajiliwa rasmi', en: 'are not yet formally registered' }
]

export function OurApproach() {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  return (
    <section className="section" id="approach">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{sw ? 'Mbinu Yetu' : 'Our Approach'}</span>
          <h2>{sw ? "Kutoka 'Kufaulu au Kufeli' hadi Njia ya Hatua kwa Hatua" : 'From pass-or-fail to a step-by-step pathway'}</h2>
          <p className="section-desc">
            {sw
              ? 'Mfumo wa “kufaulu au kufeli” husukuma watoto walio hatarini kutoka kwenye malezi yanayoonekana kwenda kwenye mazingira hatari yasiyoonekana. Tunabadilisha mwelekeo.'
              : 'A binary “pass or fail” system pushes vulnerable children out of visible care into riskier, invisible arrangements. We are changing the approach.'}
          </p>
        </div>

        {/* Three human lenses */}
        <div className="appr-personas">
          {PERSONAS.map((p) => (
            <div className="appr-persona" key={p.name}>
              <span className="appr-ava" aria-hidden>{p.icon}</span>
              <div className="appr-persona-id">
                <strong>{p.name}</strong>
                <span>{sw ? p.sw_role : p.en_role}</span>
              </div>
              <p>{sw ? p.sw : p.en}</p>
            </div>
          ))}
        </div>

        {/* Documentary photo band — drop /public/images/dar-daycare.jpg to fill;
            until then a branded gradient shows (no broken image). */}
        <div className="appr-photo">
          <span className="appr-photo-cap">
            {sw
              ? 'Vituo halisi vya malezi katika Vingunguti, Tandale, Kigogo na Kigamboni'
              : 'Real daycare centres in Vingunguti, Tandale, Kigogo and Kigamboni'}
          </span>
        </div>

        {/* The paradigm shift */}
        <div className="appr-shift">
          <div className="appr-shift-from">
            <span className="appr-shift-label">{sw ? 'Kutoka' : 'From'}</span>
            <strong>{sw ? 'Ukaguzi wa adhabu · kufaulu/kufeli' : 'Punitive inspection · pass/fail'}</strong>
          </div>
          <span className="appr-arrow" aria-hidden>→</span>
          <div className="appr-shift-to">
            <span className="appr-shift-label">{sw ? 'Hadi' : 'To'}</span>
            <strong>{sw ? 'Njia ya uboreshaji endelevu kwa msaada' : 'A supportive, progressive improvement pathway'}</strong>
          </div>
        </div>

        {/* Sector reality — sourced */}
        <div className="appr-facts">
          {FACTS.map((f) => (
            <div className="appr-fact" key={f.value}>
              <span className="appr-fact-num">{f.value}</span>
              <span className="appr-fact-lbl">{sw ? f.sw : f.en}</span>
            </div>
          ))}
        </div>
        <p className="appr-source">
          {sw ? 'Chanzo: ' : 'Source: '}
          Children in Crossfire — Status of Childcare in High-Density &amp; Low-Income Areas of Dar es Salaam; Dar Urban Childcare Study (2023).
        </p>

        {/* The anchor */}
        <div className="appr-anchor">
          <p>
            {sw
              ? 'Tunafuata mwongozo wa Serikali wa kuanzisha na kuendesha vituo vya malezi (2020) na Mfumo wa Malezi Tunzi wa WHO (2018). Mwaka 2023, Kamishna alishauri kuwa vituo vinavyofikia 60–70% ya viwango visajiliwe, kisha vipewe usimamizi wa kuunga mkono — si kufungwa.'
              : 'We follow the Government Guideline for Establishing & Managing DCCs (2020) and the WHO Nurturing Care Framework (2018). In 2023 the Commissioner advised that centres reaching 60–70% of standards should be registered, then given supportive supervision — not closed.'}
          </p>
          <p className="appr-anchor-tag">
            {sw
              ? '“Kila mtoto anastahili mwanzo salama, wenye malezi na unaochochea ukuaji.”'
              : '“Every child deserves a safe, nurturing and stimulating start in life.”'}
          </p>
        </div>
      </div>
    </section>
  )
}
