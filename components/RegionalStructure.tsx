'use client'

import Link from 'next/link'

import { useI18n } from '@/lib/i18n'
import { fmtNum } from '@/lib/format'
import { TZ_REGIONS } from '@/lib/regions'

interface RegionalStructureProps {
  centres: number
  councils: number
  children: number
  /** Region names that have live data (rendered as active, not "coming soon"). */
  liveRegions?: string[]
}

export function RegionalStructure({ centres, councils, children, liveRegions = ['Dar es Salaam'] }: RegionalStructureProps) {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  // Every Tanzania region without live data yet, shown as "coming soon".
  const liveSet = new Set(liveRegions)
  const roadmapRegions = TZ_REGIONS.filter((r) => !liveSet.has(r.name))

  return (
    <section className="section" id="regions">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">
            {sw ? 'Mtandao wa Kitaifa' : 'National Network'}
          </span>
          <h2>{sw ? 'UVIWATA kote Tanzania' : 'UVIWATA across Tanzania'}</h2>
          <p className="section-desc">
            {sw
              ? 'Kitaifa kwa muundo, kikanda kwa kazi — UVIWATA inaanza Dar es Salaam na kupanua kimkakati kwa mikoa mingine.'
              : 'National by design, regional by function — UVIWATA starts in Dar es Salaam and expands strategically to other regions.'}
          </p>
        </div>

        <div className="reg-grid">
          {/* Active founding region — clicking opens the full Dar es Salaam directory */}
          <Link href="/directory" className="reg-card reg-card-active" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            <div className="reg-card-head">
              <div className="reg-status-pill reg-status-active">
                {sw ? 'Inafanya Kazi' : 'Active'}
              </div>
              <span className="reg-flag" aria-hidden>🏙️</span>
            </div>
            <h3 className="reg-name">UVIWADA</h3>
            <p className="reg-region">{sw ? 'Dar es Salaam' : 'Dar es Salaam'}</p>
            <p className="reg-desc">
              {sw
                ? 'Chama cha kuanzisha, chenye vituo vilivyoorodheshwa, tathminiwa, na msaada wa ubora wa digital.'
                : 'The founding association, with assessed, listed centres and digital quality support.'}
            </p>
            <div className="reg-stats">
              <div className="reg-stat">
                <span className="reg-stat-value">{centres}</span>
                <span className="reg-stat-label">{sw ? 'Vituo' : 'Centres'}</span>
              </div>
              <div className="reg-stat">
                <span className="reg-stat-value">{councils}</span>
                <span className="reg-stat-label">{sw ? 'Halmashauri' : 'Councils'}</span>
              </div>
              <div className="reg-stat">
                <span className="reg-stat-value">{fmtNum(children)}</span>
                <span className="reg-stat-label">{sw ? 'Watoto' : 'Children'}</span>
              </div>
            </div>
            <span className="reg-view-link" style={{ display: 'inline-block', marginTop: '0.9rem', fontWeight: 700, color: 'var(--primary, #1A5FAA)', fontSize: '0.9rem' }}>
              {sw ? 'Tazama vituo vyote vya Dar es Salaam →' : 'View all Dar es Salaam centres →'}
            </span>
          </Link>

          {/* Roadmap regions — every Tanzania region not yet live */}
          {roadmapRegions.map((region) => (
            <div className="reg-card reg-card-roadmap" key={region.name}>
              <div className="reg-card-head">
                <div className="reg-status-pill reg-status-roadmap">
                  {sw ? 'Inakuja' : 'Coming soon'}
                </div>
                <span className="reg-flag" aria-hidden>📍</span>
              </div>
              <h3 className="reg-name">{region.name}</h3>
              <p className="reg-region">{sw ? 'Mkoa' : 'Region'}</p>
              <p className="reg-desc reg-desc-muted">
                {sw
                  ? 'Eneo hili halijajiunga bado. Tutawasiliana na wadau wa malezi ya awali wa mkoa huu mwaka 2026–2027.'
                  : 'This region has not yet joined. We will engage ECD stakeholders in this region in 2026–2027.'}
              </p>
              <div className="reg-coming-note">
                {sw ? 'Sio hai bado — mpango wa baadaye' : 'Not yet live — roadmap only'}
              </div>
            </div>
          ))}
        </div>

        <p className="reg-disclaimer">
          {sw
            ? 'Mikoa ya baadaye inawakilisha mpango wa upanuzi, sio ahadi ya tarehe. Muundo wa kikanda unategemea ushirikiano wa wadau wa ndani.'
            : 'Future regions represent an expansion roadmap, not a date commitment. Regional structure depends on engagement with local ECD stakeholders.'}
        </p>
      </div>
    </section>
  )
}
