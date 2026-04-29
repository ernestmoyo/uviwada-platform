'use client'

import Link from 'next/link'

import { useI18n } from '@/lib/i18n'
import { canSeeFieldApp, useSession } from '@/lib/use-session'
import { InstallPrompt } from './InstallPrompt'

export function FieldToolSection() {
  const { lang } = useI18n()
  const { role } = useSession()
  // Field App is the assessor's offline tool; only assessors and admins
  // (universal access) should see this section on the public homepage.
  if (!canSeeFieldApp(role)) return null
  return (
    <section className="section section-alt" id="field-app">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{lang === 'sw' ? 'Programu ya Uwandani' : 'Field Tool'}</span>
          <h2>{lang === 'sw' ? 'Programu ya Tathmini ya Ubora kwa Simu' : 'On-site Quality Assessment App'}</h2>
          <p className="section-desc">
            {lang === 'sw'
              ? 'Sakinisha kwenye simu ya Android — inafanya kazi bila intaneti, husawazisha inapopata mtandao.'
              : 'Install on Android — works fully offline, syncs when network returns.'}
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '2rem',
            background: '#fff',
            borderRadius: 16,
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.75rem 0' }}>
              {lang === 'sw' ? 'Vipengele' : 'Features'}
            </h3>
            <ul style={{ paddingLeft: '1rem', lineHeight: 1.7, margin: 0, color: 'var(--text)' }}>
              <li>
                {lang === 'sw'
                  ? 'Orodha ya tathmini ya vipengele 30 kwenye nyanja 6 za ECCE'
                  : '30-item ECCE checklist across 6 quality dimensions'}
              </li>
              <li>{lang === 'sw' ? 'Hupiga picha na kunasa GPS' : 'Photo capture and GPS auto-tagging'}</li>
              <li>
                {lang === 'sw'
                  ? 'Hufanya kazi bila intaneti; husawazisha kiotomatiki'
                  : 'Works offline; auto-syncs when back online'}
              </li>
              <li>
                {lang === 'sw'
                  ? 'Husasisha taa za trafiki za kituo papo hapo'
                  : 'Updates the centre traffic light immediately on sync'}
              </li>
              <li>{lang === 'sw' ? 'Lugha mbili: Kiswahili na Kiingereza' : 'Bilingual Sw / En'}</li>
            </ul>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <InstallPrompt />
              <Link
                href="/assess"
                className="btn"
                style={{
                  background: 'transparent',
                  color: 'var(--primary)',
                  border: '2px solid var(--primary)',
                  padding: '0.65rem 1.3rem'
                }}
              >
                {lang === 'sw' ? 'Fungua kwenye kivinjari' : 'Open in browser'}
              </Link>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '1rem' }}>
              {lang === 'sw'
                ? 'Toleo la APK la asili linapatikana baada ya pitch (litaongezwa Vipengele vya kamera + SQLite vya asili).'
                : 'Native APK build available post-pitch (adds native camera + SQLite plugins via Capacitor).'}
            </p>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #0F3D6E, #1A5FAA)',
              borderRadius: 16,
              padding: '1.5rem',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 280
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Demo flow
              </div>
              <ol style={{ marginTop: '0.5rem', paddingLeft: '1.2rem', lineHeight: 1.7 }}>
                <li>{lang === 'sw' ? 'Sakinisha kwa simu' : 'Install on phone'}</li>
                <li>{lang === 'sw' ? 'Washa hali ya ndege' : 'Switch on airplane mode'}</li>
                <li>{lang === 'sw' ? 'Jaza tathmini' : 'Complete an assessment'}</li>
                <li>{lang === 'sw' ? 'Zima hali ya ndege' : 'Turn airplane mode off'}</li>
                <li>{lang === 'sw' ? 'Tathmini inaonekana kwa Sekretarieti' : 'Assessment appears in Secretariat console'}</li>
              </ol>
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>
              {lang === 'sw'
                ? 'Imejengwa kwa Capacitor + IndexedDB + Background Sync API.'
                : 'Built with Capacitor + IndexedDB + Background Sync API.'}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
