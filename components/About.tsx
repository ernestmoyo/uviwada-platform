'use client'

import { useI18n } from '@/lib/i18n'

const CARDS = [
  {
    icon: '🏠',
    title_sw: "Chama cha Wamiliki",
    title_en: "Owners' Association",
    body_sw:
      "UVIWADA ni chama cha wamiliki wa vituo vya malezi vya watoto vya binafsi Dar es Salaam, kimeanzishwa kuimarisha uratibu, uwakilishi na mawasiliano ndani ya sekta ya malezi.",
    body_en:
      "UVIWADA is a membership-based association of private daycare centre owners in Dar es Salaam, strengthening coordination, representation and communication within the childcare sector."
  },
  {
    icon: '🤝',
    title_sw: 'Ushirikiano wa Kimkakati',
    title_en: 'Strategic Partnership',
    body_sw:
      "Tunafanya kazi kwa ushirikiano na Children in Crossfire (CiC) kupitia mpango wa Dar Urban ECCE, unaotumia mbinu ya maendeleo ya mfumo wa soko kuboresha ubora na uwezo wa kibiashara wa vituo.",
    body_en:
      'We work in strategic partnership with Children in Crossfire (CiC) through the Dar Urban ECCE programme, using a market systems approach to improve quality and commercial viability.'
  },
  {
    icon: '📊',
    title_sw: 'Mfumo wa NMECDP',
    title_en: 'NMECDP Aligned',
    body_sw:
      "Viashiria vyetu vya utendaji vinafuata Mpango wa Kitaifa wa Maendeleo ya Awali ya Mtoto wa Tanzania, kuhakikisha data yetu inachangia katika sera na ushahidi wa kitaifa.",
    body_en:
      "Our performance indicators are aligned to Tanzania's National Multisectoral Early Childhood Development Programme, ensuring our data contributes to national policy and evidence."
  }
]

export function About() {
  const { lang } = useI18n()
  return (
    <section className="section" id="about">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{lang === 'sw' ? 'Kuhusu Sisi' : 'About Us'}</span>
          <h2>{lang === 'sw' ? 'UVIWADA ni Nini?' : 'What is UVIWADA?'}</h2>
        </div>
        <div className="about-grid">
          {CARDS.map((c) => (
            <div className="about-card" key={c.title_en}>
              <div className="about-icon">{c.icon}</div>
              <h3>{lang === 'sw' ? c.title_sw : c.title_en}</h3>
              <p>{lang === 'sw' ? c.body_sw : c.body_en}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
