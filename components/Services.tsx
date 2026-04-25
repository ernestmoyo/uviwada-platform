'use client'

import { useI18n } from '@/lib/i18n'

const QUALITY_DEMO = [
  { class: 'green', sw: 'Miundombinu', en: 'Infrastructure' },
  { class: 'amber', sw: 'Wafanyakazi', en: 'Staffing' },
  { class: 'green', sw: 'Mtaala', en: 'Curriculum' },
  { class: 'red', sw: 'Usafi', en: 'Hygiene' },
  { class: 'green', sw: 'Ulinzi wa Mtoto', en: 'Safeguarding' }
]

const CARDS = [
  {
    icon: '📋',
    title_sw: 'Usimamizi wa Uanachama',
    title_en: 'Membership Management',
    body_sw: 'Usajili mtandaoni, wasifu wa kituo, usimamizi wa mzunguko wa uanachama, vikumbusho vya kiotomatiki',
    body_en: 'Online registration, centre profiles, membership lifecycle management, automated renewal reminders'
  },
  {
    icon: '🎓',
    title_sw: 'Mafunzo na Uwezo',
    title_en: 'Training & Capacity',
    body_sw: 'Kalenda ya mafunzo, usajili mtandaoni, utoaji wa vyeti, historia ya mafunzo ya kituo',
    body_en: 'Training calendar, online registration, certificate generation, centre-level training history'
  },
  {
    icon: '📜',
    title_sw: 'Uzingatiaji wa Kanuni',
    title_en: 'Regulatory Compliance',
    body_sw: 'Ufuatiliaji wa leseni, vikumbusho vya muda wa kuisha, hazina ya nyaraka, taarifa za udhibiti',
    body_en: 'License tracking, expiry reminders, document repository, regulatory update notifications'
  },
  {
    icon: '💰',
    title_sw: 'Msaada wa Biashara',
    title_en: 'Business Viability',
    body_sw: 'Maktaba ya rasilimali za biashara, bodi ya fursa za kifedha, jukwaa la kujifunza kwa wenzao',
    body_en: 'Business resource library, financing opportunities board, peer learning forum'
  },
  {
    icon: '🛡️',
    title_sw: 'Ustawi wa Mtoto',
    title_en: 'Child Welfare',
    body_sw: 'Ripoti za usajili wa watoto, orodha za ustawi, sera za ulinzi, ripoti za matukio ya siri',
    body_en: 'Child enrolment reporting, wellbeing checklists, protection policies, confidential incident reporting'
  }
]

export function Services() {
  const { lang } = useI18n()
  return (
    <section className="section section-alt" id="services">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{lang === 'sw' ? 'Huduma za Wanachama' : 'Member Services'}</span>
          <h2>{lang === 'sw' ? 'Jukwaa la Huduma za Kidijitali' : 'Digital Service Platform'}</h2>
          <p className="section-desc">
            {lang === 'sw'
              ? 'Moduli saba za huduma zinazotolewa kupitia portal ya wanachama'
              : 'Seven integrated service modules delivered through the member portal'}
          </p>
        </div>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">{CARDS[0].icon}</div>
            <h4>{lang === 'sw' ? CARDS[0].title_sw : CARDS[0].title_en}</h4>
            <p>{lang === 'sw' ? CARDS[0].body_sw : CARDS[0].body_en}</p>
          </div>
          <div className="service-card featured">
            <div className="service-badge">{lang === 'sw' ? 'Muhimu' : 'Key Feature'}</div>
            <div className="service-icon">✅</div>
            <h4>{lang === 'sw' ? 'Ufuatiliaji wa Ubora' : 'Quality Improvement Tracking'}</h4>
            <p>
              {lang === 'sw'
                ? 'Tathmini za ubora zilizounganishwa na viwango vya serikali, ukadiriaji wa taa za trafiki, ufuatiliaji wa mwenendo'
                : 'Quality assessments aligned to government ECCE standards, traffic-light ratings, longitudinal trend tracking'}
            </p>
            <div className="quality-demo">
              {QUALITY_DEMO.map((q) => (
                <div className="quality-item" key={q.en}>
                  <span className={`traffic-light ${q.class}`} />
                  <span>{lang === 'sw' ? q.sw : q.en}</span>
                </div>
              ))}
            </div>
          </div>
          {CARDS.slice(1).map((c) => (
            <div className="service-card" key={c.title_en}>
              <div className="service-icon">{c.icon}</div>
              <h4>{lang === 'sw' ? c.title_sw : c.title_en}</h4>
              <p>{lang === 'sw' ? c.body_sw : c.body_en}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
