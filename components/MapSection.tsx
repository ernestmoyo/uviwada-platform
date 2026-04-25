'use client'

import dynamic from 'next/dynamic'

import { DISTRICT_COLOURS } from '@/lib/seed-data'
import { useI18n } from '@/lib/i18n'
import type { PublicCentre } from '@/lib/data'

const WardMap = dynamic(() => import('./WardMap').then((m) => m.WardMap), {
  ssr: false,
  loading: () => <div id="mapView" style={{ background: '#f1f5f9' }} />
})

interface MapSectionProps {
  centres: PublicCentre[]
}

export function MapSection({ centres }: MapSectionProps) {
  const { lang } = useI18n()
  return (
    <section className="section section-alt" id="map">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{lang === 'sw' ? 'Ramani ya GIS' : 'GIS Map'}</span>
          <h2>{lang === 'sw' ? 'Vituo vya Wanachama - Dar es Salaam' : 'Member Centres - Dar es Salaam'}</h2>
          <p className="section-desc">
            {lang === 'sw'
              ? 'Ramani ya mwingiliano inayoonyesha usambazaji wa vituo katika kata za Dar es Salaam'
              : 'Interactive map showing centre distribution across Dar es Salaam wards'}
          </p>
        </div>
        <div className="map-container">
          <div className="map-legend">
            <div className="legend-item">
              <span className="legend-dot green" />
              <span>{lang === 'sw' ? 'Ubora Mzuri' : 'Good Quality'}</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot amber" />
              <span>{lang === 'sw' ? 'Unahitaji Kuboresha' : 'Needs Improvement'}</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot red" />
              <span>{lang === 'sw' ? 'Chini ya Kiwango' : 'Below Standard'}</span>
            </div>
          </div>
          <WardMap centres={centres} />
          <div className="map-district-legend">
            {Object.entries(DISTRICT_COLOURS).map(([district, colour]) => (
              <div className="district-tag" key={district}>
                <span className="district-swatch" style={{ background: colour }} />
                {district}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
