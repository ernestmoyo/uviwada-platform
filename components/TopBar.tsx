'use client'

import { useI18n } from '@/lib/i18n'

export function TopBar() {
  const { lang, toggle } = useI18n()
  return (
    <div className="top-bar">
      <div className="container top-bar-inner">
        <span>
          {lang === 'sw'
            ? 'Kuimarisha huduma za malezi Dar es Salaam'
            : 'Strengthening childcare services in Dar es Salaam'}
        </span>
        <button className="lang-toggle" onClick={toggle} aria-label="Switch language">
          <span className={`lang-flag ${lang === 'en' ? 'active' : ''}`}>EN</span> /{' '}
          <span className={`lang-flag ${lang === 'sw' ? 'active' : ''}`}>SW</span>
        </button>
      </div>
    </div>
  )
}
