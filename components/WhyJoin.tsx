'use client'

import Link from 'next/link'

import { useI18n } from '@/lib/i18n'

// "Why Join UVIWATA?" — requirement §251. Presents the practical membership
// benefits in simple, attractive cards. Member value proposition runs through
// the public face of the platform, not just the registration form.
const BENEFITS = [
  {
    icon: '📍',
    sw: 'Mwonekano wa Umma',
    en: 'Public visibility',
    sw_desc: 'Kituo chako kinaonekana kwa wazazi kwenye ramani na orodha ya umma.',
    en_desc: 'Your centre appears to parents on the public map and directory.'
  },
  {
    icon: '✅',
    sw: 'Utambulisho Uliothibitishwa',
    en: 'Verified identity',
    sw_desc: 'Beji ya mwanachama aliyethibitishwa hujenga imani kwa wazazi.',
    en_desc: 'A verified-member badge builds trust with parents.'
  },
  {
    icon: '🎓',
    sw: 'Mafunzo na Ujifunzaji',
    en: 'Training & learning',
    sw_desc: 'Fursa za mafunzo na nyenzo za vitendo kwa walezi.',
    en_desc: 'Access to training opportunities and practical caregiver resources.'
  },
  {
    icon: '⭐',
    sw: 'Kutambuliwa kwa Ubora',
    en: 'Quality recognition',
    sw_desc: 'Msaada wa kuboresha ubora na kutambuliwa kwa maendeleo yako.',
    en_desc: 'Quality-improvement support and recognition for your progress.'
  },
  {
    icon: '🤝',
    sw: 'Sauti ya Pamoja',
    en: 'A collective voice',
    sw_desc: 'Muunganiko na chama cha kitaifa kinachotambulika.',
    en_desc: 'Connection to a recognised national association.'
  },
  {
    icon: '💬',
    sw: 'Mawasiliano',
    en: 'Stay connected',
    sw_desc: 'Taarifa, vikumbusho na fursa kupitia SMS na WhatsApp.',
    en_desc: 'Updates, reminders and opportunities via SMS and WhatsApp.'
  }
]

export function WhyJoin() {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  return (
    <section className="section section-alt" id="why-join">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{sw ? 'Faida za Uanachama' : 'Member Value'}</span>
          <h2>{sw ? 'Kwa Nini Ujiunge na UVIWATA?' : 'Why Join UVIWATA?'}</h2>
          <p className="section-desc">
            {sw
              ? 'Uanachama unaleta mwonekano, uaminifu, ujifunzaji na ukuaji wa biashara kwa kituo chako cha malezi.'
              : 'Membership brings visibility, credibility, learning and business growth to your daycare centre.'}
          </p>
        </div>
        <div className="why-grid">
          {BENEFITS.map((b) => (
            <div className="why-card" key={b.en}>
              <span className="why-icon" aria-hidden>
                {b.icon}
              </span>
              <h4>{sw ? b.sw : b.en}</h4>
              <p>{sw ? b.sw_desc : b.en_desc}</p>
            </div>
          ))}
        </div>
        <div className="why-cta">
          <Link href="/portal/register" className="btn btn-primary">
            {sw ? 'Jiunge na UVIWATA' : 'Join UVIWATA'}
          </Link>
        </div>
      </div>
    </section>
  )
}
