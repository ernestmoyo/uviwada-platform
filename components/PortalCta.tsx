'use client'

import Link from 'next/link'

import { useI18n } from '@/lib/i18n'

const FEATURES = [
  {
    title_sw: 'Wasifu wa Kituo Mtandaoni',
    title_en: 'Online Centre Profile',
    body_sw: 'Onesha kituo chako kwenye orodha ya wanachama',
    body_en: 'Showcase your centre in the member directory'
  },
  {
    title_sw: 'Tathmini za Ubora',
    title_en: 'Quality Assessments',
    body_sw: 'Fuatilia maendeleo yako na taa za trafiki',
    body_en: 'Track your progress with traffic-light ratings'
  },
  {
    title_sw: 'Kalenda ya Mafunzo',
    title_en: 'Training Calendar',
    body_sw: 'Jiandikishe kwa mafunzo na upate vyeti',
    body_en: 'Register for trainings and earn certificates'
  },
  {
    title_sw: 'Msaada wa Leseni',
    title_en: 'Licensing Support',
    body_sw: 'Vikumbusho vya muda wa kuisha na masasisho ya kanuni',
    body_en: 'Expiry reminders and regulatory updates'
  },
  {
    title_sw: 'Mtandao wa Wenzao',
    title_en: 'Peer Network',
    body_sw: 'Jifunze kutoka kwa wamiliki wengine wa vituo',
    body_en: 'Learn from other centre owners'
  }
]

export function PortalCta() {
  const { lang } = useI18n()
  return (
    <section className="section" id="portal">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{lang === 'sw' ? 'Portal ya Wanachama' : 'Member Portal'}</span>
          <h2>{lang === 'sw' ? 'Jiunge na UVIWADA Leo' : 'Join UVIWADA Today'}</h2>
        </div>
        <div className="portal-preview">
          <div className="portal-form-card">
            <h3>{lang === 'sw' ? 'Mwanzo wa Sajili' : 'Get Started'}</h3>
            <p className="form-note">
              {lang === 'sw'
                ? 'Kamilisha usajili wa kituo kwa dakika chache na uingie kwenye portal ya wanachama.'
                : 'Complete centre registration in a few minutes and access the member portal.'}
            </p>
            <Link href="/portal/register" className="btn btn-primary btn-full">
              {lang === 'sw' ? 'Sajili Kituo Chako' : 'Register Your Centre'}
            </Link>
            <p className="form-note" style={{ marginTop: '1rem', textAlign: 'center' }}>
              {lang === 'sw' ? 'Tayari ni mwanachama?' : 'Already a member?'}{' '}
              <Link href="/portal" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                {lang === 'sw' ? 'Ingia hapa' : 'Sign in here'}
              </Link>
            </p>
          </div>
          <div className="portal-features">
            <h3>{lang === 'sw' ? 'Baada ya Kujiunga Utapata:' : 'After Joining You Get:'}</h3>
            <div className="feature-list">
              {FEATURES.map((f) => (
                <div className="feature-item" key={f.title_en}>
                  <span className="feature-check">✓</span>
                  <div>
                    <strong>{lang === 'sw' ? f.title_sw : f.title_en}</strong>
                    <p>{lang === 'sw' ? f.body_sw : f.body_en}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
