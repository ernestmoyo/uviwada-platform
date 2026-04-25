'use client'

import { useState } from 'react'

import { FALLBACK_DASHBOARD } from '@/lib/seed-data'
import { useI18n } from '@/lib/i18n'
import type { DashboardSnapshot } from '@/lib/data'

import { QualityDonut } from './charts/QualityDonut'
import { MembershipLine } from './charts/MembershipLine'

interface DashboardProps {
  snapshot: DashboardSnapshot
}

export function Dashboard({ snapshot }: DashboardProps) {
  const { lang } = useI18n()
  const [tab, setTab] = useState<'uviwada' | 'cic'>('uviwada')
  const cic = FALLBACK_DASHBOARD.cic

  return (
    <section className="section" id="dashboard">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{lang === 'sw' ? 'Dashibodi ya M&E' : 'M&E Dashboard'}</span>
          <h2>{lang === 'sw' ? 'Takwimu na Uchambuzi' : 'Data & Analytics'}</h2>
          <p className="section-desc">
            {lang === 'sw'
              ? 'Dashibodi za wakati halisi zilizounganishwa na viashiria vya NMECDP'
              : 'Real-time dashboards aligned to NMECDP indicators'}
          </p>
        </div>
        <div className="dashboard-preview">
          <div className="dash-tabs">
            <button
              className={`dash-tab ${tab === 'uviwada' ? 'active' : ''}`}
              onClick={() => setTab('uviwada')}
            >
              UVIWADA
            </button>
            <button className={`dash-tab ${tab === 'cic' ? 'active' : ''}`} onClick={() => setTab('cic')}>
              CiC Programme
            </button>
          </div>

          {tab === 'uviwada' && (
            <div className="dash-content">
              <div className="dash-cards">
                <KpiCard
                  label={lang === 'sw' ? 'Jumla ya Wanachama' : 'Total Members'}
                  value={snapshot.totalMembers.toString()}
                  trend="+12%"
                  trendKind="up"
                />
                <KpiCard
                  label={lang === 'sw' ? 'Vituo Hai' : 'Active Centres'}
                  value={snapshot.activeCentres.toString()}
                  trend="+8%"
                  trendKind="up"
                />
                <KpiCard
                  label={lang === 'sw' ? 'Kiwango cha Ubora wa Wastani' : 'Avg Quality Score'}
                  value={`${snapshot.avgQualityPct}%`}
                  trend="+5%"
                  trendKind="up"
                />
                <KpiCard
                  label={lang === 'sw' ? 'Mafunzo Yaliyokamilika' : 'Trainings Completed'}
                  value={snapshot.trainingsCompleted.toString()}
                  trend="Q1 2026"
                  trendKind="neutral"
                />
              </div>
              <div className="dash-charts">
                <div className="chart-box">
                  <h4>
                    {lang === 'sw' ? 'Usambazaji wa Ubora wa Wanachama' : 'Member Quality Distribution'}
                  </h4>
                  <div className="chart-canvas-wrap">
                    <QualityDonut counts={snapshot.qualityDistribution} />
                  </div>
                </div>
                <div className="chart-box">
                  <h4>{lang === 'sw' ? 'Ukuaji wa Uanachama' : 'Membership Growth'}</h4>
                  <div className="chart-canvas-wrap">
                    <MembershipLine
                      labels={snapshot.membershipGrowth.labels}
                      data={snapshot.membershipGrowth.data}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'cic' && (
            <div className="dash-content">
              <div className="dash-cards">
                <KpiCard
                  label={lang === 'sw' ? 'Viashiria vya NMECDP' : 'NMECDP Indicators'}
                  value={cic.nmecdpTracked}
                  trend={lang === 'sw' ? 'Zinafuatiliwa' : 'Tracked'}
                  trendKind="up"
                />
                <KpiCard
                  label={lang === 'sw' ? 'Vituo Vilivyoboreshwa' : 'Centres Improved'}
                  value={cic.centresImproved.toString()}
                  trend="+23%"
                  trendKind="up"
                />
                <KpiCard
                  label={lang === 'sw' ? 'Watoto Walioathiriwa' : 'Children Impacted'}
                  value={cic.childrenImpacted.toLocaleString()}
                  trend="+15%"
                  trendKind="up"
                />
                <KpiCard
                  label={lang === 'sw' ? 'Ripoti za Wafadhili' : 'Donor Reports'}
                  value={cic.donorReports.toString()}
                  trend="Q1 2026"
                  trendKind="neutral"
                />
              </div>
              <div className="nmecdp-indicators">
                <h4>{lang === 'sw' ? 'Hali ya Viashiria vya NMECDP' : 'NMECDP Indicator Status'}</h4>
                <div className="indicator-list">
                  {cic.indicators.map((ind) => (
                    <div className="indicator" key={ind.label_en}>
                      <span className={`ind-status ${ind.status}`} />
                      <span>{lang === 'sw' ? ind.label_sw : ind.label_en}</span>
                      <span className="ind-val">{ind.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

interface KpiCardProps {
  label: string
  value: string
  trend: string
  trendKind: 'up' | 'neutral'
}

function KpiCard({ label, value, trend, trendKind }: KpiCardProps) {
  return (
    <div className="dash-card">
      <span className="dash-card-label">{label}</span>
      <span className="dash-card-value">{value}</span>
      <span className={`dash-card-trend ${trendKind}`}>{trend}</span>
    </div>
  )
}
