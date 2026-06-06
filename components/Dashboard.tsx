'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useI18n } from '@/lib/i18n'
import type { RubricCentre, RubricMeta } from '@/lib/rubric-data'
import {
  capacityBands,
  computeKpis,
  councilDist,
  infraScorecard,
  ownershipDist,
  registrationDist,
  tierStats,
  uniqueCouncils,
  pct
} from '@/lib/sector'

const TRAFFIC = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' }

interface DashboardProps {
  centres: RubricCentre[]
  meta: RubricMeta
  source: 'live' | 'fallback'
}

export function Dashboard({ centres: all, meta, source }: DashboardProps) {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [council, setCouncil] = useState('All')

  const councils = useMemo(() => ['All', ...uniqueCouncils(all)], [all])
  const centres = useMemo(
    () => (council === 'All' ? all : all.filter((c) => c.council === council)),
    [all, council]
  )

  const k = useMemo(() => computeKpis(centres), [centres])
  const tiers = useMemo(() => tierStats(centres), [centres])
  const infra = useMemo(() => infraScorecard(centres), [centres])
  const caps = useMemo(() => capacityBands(centres), [centres])
  const councilsDist = useMemo(() => councilDist(centres), [centres])
  const ownDist = useMemo(() => ownershipDist(centres), [centres])
  const regDist = useMemo(() => registrationDist(centres), [centres])
  const dc = meta.dataCompleteness

  return (
    <section className="section" id="dashboard">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{sw ? 'Dashibodi ya Sekta' : 'Sector Dashboard'}</span>
          <h2>{sw ? 'Takwimu Halisi za Vituo vya Malezi' : 'Live Daycare Sector Data'}</h2>
          <p className="section-desc">
            {sw
              ? `Matokeo ya awali kutoka vituo ${meta.totalRecords} vilivyotathminiwa kwa kutumia kigezo cha kitaifa cha ubora — Dar es Salaam.`
              : `Preliminary results from ${meta.totalRecords} centres assessed on the national quality rubric — Dar es Salaam.`}
          </p>
        </div>

        {/* Honesty caveat — never imply more is scored than really is */}
        <div className="dash-caveat">
          <strong>{sw ? 'Matokeo ya awali.' : 'Preliminary results.'}</strong>{' '}
          {sw
            ? `${dc.total} vituo vimetathminiwa (${dc.date_from} → ${dc.date_to}). Uwezo wa walezi umepimwa kwa vituo ${dc.capacity_scored}; miundombinu kwa ${dc.infra_scored}/${dc.total} — ukusanyaji unaendelea. Hakuna takwimu zilizokisiwa.`
            : `${dc.total} centres assessed (${dc.date_from} → ${dc.date_to}). Careworker capacity scored for ${dc.capacity_scored}; infrastructure composite for ${dc.infra_scored}/${dc.total} — collection ongoing. No values imputed.`}{' '}
          <span style={{ opacity: 0.8 }}>
            {sw ? 'Chanzo: ' : 'Source: '}
            {source === 'live' ? (sw ? 'data hai ya jukwaa' : 'live platform data') : sw ? 'data ya awali' : 'preliminary extract'}.
          </span>
        </div>

        {/* Filter */}
        <div className="dash-filterbar">
          <label className="dash-filter">
            <span>{sw ? 'Halmashauri' : 'Council'}</span>
            <select value={council} onChange={(e) => setCouncil(e.target.value)}>
              {councils.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? (sw ? 'Zote' : 'All councils') : c}
                </option>
              ))}
            </select>
          </label>
          <span className="dash-showing">
            {sw ? 'Inaonyesha' : 'Showing'} <strong>{centres.length}</strong> {sw ? 'kati ya' : 'of'} {all.length}{' '}
            {sw ? 'vituo' : 'centres'}
          </span>
        </div>

        {/* Animated KPI strip — the figures donors see first */}
        <div className="kpi-grid">
          <Kpi value={k.centres} label={sw ? 'Vituo vilivyotathminiwa' : 'Centres assessed'} />
          <Kpi value={k.councils} label={sw ? 'Halmashauri' : 'Councils'} accent="var(--primary)" />
          <Kpi value={k.children} label={sw ? 'Watoto walioandikishwa' : 'Children enrolled'} accent="#0891b2" />
          <Kpi value={k.careworkers} label={sw ? 'Walezi kazini' : 'Careworkers'} accent="#7c3aed" />
          <Kpi
            value={k.meanCapacity == null ? null : Math.round(k.meanCapacity)}
            suffix="/100"
            label={sw ? 'Wastani wa uwezo wa walezi' : 'Mean careworker capacity'}
            accent="#f59e0b"
          />
          <Kpi value={k.registeredPct} suffix="%" label={sw ? 'Wamesajiliwa kikamilifu' : 'Fully registered'} accent={TRAFFIC.red} />
        </div>

        {/* Rich cards */}
        <div className="dash-grid">
          <Card
            title={sw ? 'Ngazi za ubora' : 'Quality tiers'}
            subtitle={
              sw
                ? `Kati ya vituo ${tiers.scoredN} vilivyopata alama kamili · ${tiers.pending} bado vinasubiri`
                : `Among ${tiers.scoredN} fully-scored centres · ${tiers.pending} still pending`
            }
          >
            {tiers.scoredN === 0 ? (
              <Empty sw={sw} />
            ) : (
              (['Level 4', 'Level 3', 'Level 2'] as const).map((t) => (
                <Bar
                  key={t}
                  label={t}
                  value={tiers.scored[t]}
                  max={tiers.scoredN}
                  color={t === 'Level 4' ? TRAFFIC.green : t === 'Level 3' ? TRAFFIC.amber : TRAFFIC.red}
                  suffix={` (${pct(tiers.scored[t], tiers.scoredN)}%)`}
                />
              ))
            )}
            {tiers.pending > 0 && (
              <p className="dash-note">
                {sw
                  ? `Vituo ${tiers.pending} vimeachwa nje hadi alama ya miundombinu ikamilike — ili kutokuza ubora kupita kiasi.`
                  : `${tiers.pending} centres excluded pending their infrastructure composite — to avoid overstating quality.`}
              </p>
            )}
          </Card>

          <Card title={sw ? 'Vituo kwa halmashauri' : 'Centres by council'}>
            {councilsDist.map((d) => (
              <Bar key={d.label} label={d.label} value={d.value} max={councilsDist[0]?.value ?? 1} color="var(--primary)" />
            ))}
          </Card>

          <Card title={sw ? 'Umiliki na usajili' : 'Ownership & registration'}>
            <div className="dash-sublabel">{sw ? 'Umiliki' : 'Ownership'}</div>
            {ownDist.map((d) => (
              <Bar key={d.label} label={d.label} value={d.value} max={ownDist[0]?.value ?? 1} color="#334155" dense />
            ))}
            <div className="dash-sublabel" style={{ marginTop: '0.7rem' }}>
              {sw ? 'Hali ya usajili' : 'Registration status'}
            </div>
            {regDist.map((d) => (
              <Bar
                key={d.label}
                label={shorten(d.label)}
                value={d.value}
                max={regDist[0]?.value ?? 1}
                color={/^Registered/i.test(d.label) ? TRAFFIC.green : TRAFFIC.amber}
                dense
              />
            ))}
          </Card>

          <Card
            title={sw ? 'Miundombinu — alama dhaifu kwanza' : 'Infrastructure — weakest first'}
            subtitle={sw ? 'Wastani wa ngazi 1–4' : 'Mean level 1–4'}
          >
            {infra.map((d) => (
              <Bar key={d.key} label={d.label} value={d.mean ?? 0} max={4} color={barColor(d.mean)} suffix={d.mean == null ? ' —' : ''} dense />
            ))}
          </Card>

          <Card
            title={sw ? 'Uwezo wa walezi' : 'Careworker capacity'}
            subtitle={
              sw
                ? `Alama /100 · wastani ${k.meanCapacity == null ? '—' : k.meanCapacity.toFixed(1)} · n=${k.capacityScoredN}`
                : `Score /100 · mean ${k.meanCapacity == null ? '—' : k.meanCapacity.toFixed(1)} · n=${k.capacityScoredN}`
            }
          >
            {caps.map((b, i) => (
              <Bar
                key={b.label}
                label={b.label}
                value={b.value}
                max={Math.max(...caps.map((x) => x.value)) || 1}
                color={['#ef4444', '#f59e0b', '#84cc16', '#22c55e'][i]}
              />
            ))}
            <p className="dash-note">
              {sw
                ? 'Raundi hii ilirekodi alama ya jumla; umahiri 13 unarekodiwa mmoja mmoja kuanzia sasa.'
                : 'This round captured the rolled-up score; the 13 competencies are recorded individually going forward.'}
            </p>
          </Card>

          <Card
            title={sw ? 'Watoto wanaohudumiwa' : 'Children served'}
            subtitle={sw ? 'Kwa vituo vilivyochaguliwa' : 'Across the selected centres'}
          >
            <Bar label={sw ? 'Wasichana' : 'Girls'} value={k.girls} max={Math.max(k.girls, k.boys) || 1} color="#ec4899" />
            <Bar label={sw ? 'Wavulana' : 'Boys'} value={k.boys} max={Math.max(k.girls, k.boys) || 1} color="#3b82f6" />
            <div className="dash-childrow">
              <div>
                <span className="dash-childnum">{k.disabilityCount.toLocaleString()}</span>
                <span className="dash-childlbl">{sw ? 'watoto wenye ulemavu' : 'children with disabilities'}</span>
              </div>
              <div>
                <span className="dash-childnum">{k.medianFee == null ? '—' : k.medianFee.toLocaleString()}</span>
                <span className="dash-childlbl">{sw ? 'ada ya kati (TZS/mwezi)' : 'median fee (TZS/month)'}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="dash-explore">
          <Link href="/quality" className="btn btn-outline">
            {sw ? 'Chunguza data kamili ya ubora →' : 'Explore the full quality data →'}
          </Link>
        </div>
      </div>
    </section>
  )
}

// ---- atoms ------------------------------------------------------------------
function Kpi({ value, label, suffix = '', accent }: { value: number | null; label: string; suffix?: string; accent?: string }) {
  const display = useCountUp(value ?? 0)
  return (
    <div className="kpi-card">
      <span className="kpi-value" style={accent ? { color: accent } : undefined}>
        {value == null ? '—' : display.toLocaleString()}
        {value == null ? '' : suffix}
      </span>
      <span className="kpi-label">{label}</span>
    </div>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="dash-card-rich">
      <h4>{title}</h4>
      {subtitle ? <p className="dash-card-sub">{subtitle}</p> : <div style={{ height: '0.6rem' }} />}
      {children}
    </div>
  )
}

function Bar({
  label,
  value,
  max,
  color,
  suffix = '',
  dense = false
}: {
  label: string
  value: number
  max: number
  color: string
  suffix?: string
  dense?: boolean
}) {
  const w = Math.max(2, Math.min(100, (value / (max || 1)) * 100))
  return (
    <div className={`dash-bar ${dense ? 'dense' : ''}`}>
      <div className="dash-bar-head">
        <span>{label}</span>
        <strong>
          {Number.isInteger(value) ? value : value.toFixed(2)}
          {suffix}
        </strong>
      </div>
      <div className="dash-bar-track">
        <div className="dash-bar-fill" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  )
}

function Empty({ sw }: { sw: boolean }) {
  return <p className="dash-note">{sw ? 'Hakuna vituo vyenye alama katika uchaguzi huu.' : 'No scored centres in this selection.'}</p>
}

function shorten(s: string) {
  return s.length > 32 ? s.slice(0, 31) + '…' : s
}
function barColor(m: number | null) {
  return m == null ? '#cbd5e1' : m < 2 ? TRAFFIC.red : m < 2.5 ? TRAFFIC.amber : TRAFFIC.green
}

// Count-up animation that re-runs whenever the target changes (e.g. council
// filter), so the figures feel live without resetting to 0 on every render.
function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(target)
  const fromRef = useRef(target)
  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    let raf = 0
    let start: number | null = null
    const tick = (ts: number) => {
      if (start == null) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}
