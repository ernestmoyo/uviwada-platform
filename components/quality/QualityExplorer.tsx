'use client'

import { useMemo, useState } from 'react'

import type { RubricSnapshot, RubricCentre } from '@/lib/rubric-data'
import { INFRA_SUBDOMAINS, tierLabelToTrafficLight } from '@/lib/rubric'
import { RubricMap, type RubricMapPoint } from './RubricMap'

const TRAFFIC = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' }
const tierShort = (t: string | null) => (!t ? 'Pending' : t.includes('Level 4') ? 'Level 4' : t.includes('Level 3') ? 'Level 3' : 'Level 2')

function mean(xs: Array<number | null | undefined>): number | null {
  const v = xs.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}
function median(xs: Array<number | null | undefined>): number | null {
  const v = xs.filter((x): x is number => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b)
  return v.length ? v[Math.floor(v.length / 2)] : null
}
const sum = (xs: Array<number | null | undefined>) => xs.reduce<number>((a, b) => a + (Number.isFinite(b as number) ? (b as number) : 0), 0)
const fmt = (n: number | null | undefined) => (n == null ? '—' : Math.round(n).toLocaleString('en-US'))

export function QualityExplorer({ snapshot }: { snapshot: RubricSnapshot }) {
  const all = snapshot.centres
  const [council, setCouncil] = useState<string>('All')
  const [ward, setWard] = useState<string>('All')
  const [ownership, setOwnership] = useState<string>('All')
  const [tier, setTier] = useState<string>('All')

  const councils = useMemo(() => ['All', ...uniq(all.map((c) => c.council))], [all])
  const wardOptions = useMemo(() => {
    const subset = council === 'All' ? all : all.filter((c) => c.council === council)
    return ['All', ...uniq(subset.map((c) => c.ward))]
  }, [all, council])
  const ownerships = useMemo(() => ['All', ...uniq(all.map((c) => c.ownership))], [all])
  const tiers = ['All', 'Level 4', 'Level 3', 'Level 2']

  const centres = useMemo(
    () =>
      all.filter(
        (c) =>
          (council === 'All' || c.council === council) &&
          (ward === 'All' || c.ward === ward) &&
          (ownership === 'All' || c.ownership === ownership) &&
          (tier === 'All' || tierShort(c.tier) === tier)
      ),
    [all, council, ward, ownership, tier]
  )

  const k = useMemo(() => kpis(centres), [centres])
  const infraScore = useMemo(() => scorecard(centres, INFRA_SUBDOMAINS, (c) => c.infra), [centres])
  const capBands = useMemo(() => scoreBands(centres.map((c) => c.capacity_score)), [centres])
  const councilDist = useMemo(() => countBy(centres, (c) => c.council), [centres])
  const ownDist = useMemo(() => countBy(centres, (c) => c.ownership), [centres])
  const regDist = useMemo(() => countBy(centres, (c) => c.registration), [centres])
  const points: RubricMapPoint[] = useMemo(
    () =>
      centres
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => ({ name: c.name, lat: c.lat as number, lng: c.lng as number, council: c.council, tier: c.tier, traffic: tierLabelToTrafficLight(c.tier) })),
    [centres]
  )

  const dc = snapshot.meta.dataCompleteness

  return (
    <div>
      {/* caveat banner */}
      <div style={{ background: '#FDF3E0', border: '1px solid #F2C879', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#7a5200' }}>
        <strong>Preliminary results.</strong> {dc.total} centres assessed ({dc.date_from} → {dc.date_to}). Careworker capacity scored for {dc.capacity_scored}, infrastructure composite for {dc.infra_scored}/{dc.total} — collection ongoing. No values imputed.{' '}
        <span style={{ opacity: 0.8 }}>Source: {snapshot.source === 'live' ? 'live platform data' : 'preliminary extract'}.</span>
      </div>

      {/* filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <Filter label="Council" value={council} options={councils} onChange={(v) => { setCouncil(v); setWard('All') }} />
        <Filter label="Ward" value={ward} options={wardOptions} onChange={setWard} />
        <Filter label="Ownership" value={ownership} options={ownerships} onChange={setOwnership} />
        <Filter label="Tier" value={tier} options={tiers} onChange={setTier} />
        <div style={{ alignSelf: 'flex-end', fontSize: '0.82rem', color: 'var(--muted)' }}>
          Showing <strong>{centres.length}</strong> of {all.length} centres
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        <Kpi label="Centres" value={fmt(k.count)} />
        <Kpi label="Children enrolled" value={fmt(k.children)} accent="#0891b2" />
        <Kpi label="Councils" value={String(k.councils)} />
        <Kpi label="Mean capacity /100" value={k.capacity == null ? '—' : k.capacity.toFixed(1)} accent="#f59e0b" />
        <Kpi label="Fully registered" value={`${k.pctRegistered}%`} accent="#ef4444" />
        <Kpi label="Median fee (TZS)" value={fmt(k.medFee)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
        {/* map */}
        <Card title="Where the centres are" subtitle="Coloured by quality tier · click a point">
          <RubricMap points={points} />
        </Card>

        {/* tiers honest */}
        <Card title="Quality tiers" subtitle={`Among ${k.tierScoredN} fully-scored centres · ${k.tierPending} still pending`}>
          {k.tierScoredN === 0 ? (
            <Empty />
          ) : (
            ['Level 4', 'Level 3', 'Level 2'].map((t) => (
              <Bar key={t} label={t} value={k.tierScored[t] ?? 0} max={k.tierScoredN} color={t === 'Level 4' ? TRAFFIC.green : t === 'Level 3' ? TRAFFIC.amber : TRAFFIC.red} suffix={` (${pct(k.tierScored[t] ?? 0, k.tierScoredN)}%)`} />
            ))
          )}
          {k.tierPending > 0 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.6rem' }}>
              {k.tierPending} centres default to “Level 4” pending their infrastructure composite — excluded above to avoid overstating quality.
            </p>
          )}
        </Card>

        {/* infra scorecard */}
        <Card title="Infrastructure scorecard" subtitle="Mean level 1–4 · weakest first">
          {infraScore.map((d) => (
            <Bar key={d.key} label={d.label} value={d.mean ?? 0} max={4} color={barColor(d.mean)} suffix={d.mean == null ? ' —' : ''} dense />
          ))}
        </Card>

        {/* capacity score distribution (per-competency not captured this round) */}
        <Card title="Careworker capacity" subtitle={`Domain score /100 · mean ${k.capacity == null ? '—' : k.capacity.toFixed(1)} · n=${k.capacityScoredN}`}>
          {capBands.map((b, i) => (
            <Bar key={b.label} label={b.label} value={b.n} max={capBands[0] ? Math.max(...capBands.map((x) => x.n)) || 1 : 1} color={['#ef4444', '#f59e0b', '#84cc16', '#22c55e'][i]} />
          ))}
          <p style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
            This round captured the rolled-up score only; the 13 competencies are recorded individually going forward.
          </p>
        </Card>

        {/* council */}
        <Card title="Centres by council">
          {councilDist.map(([label, v]) => (
            <Bar key={label} label={label} value={v} max={councilDist[0]?.[1] ?? 1} color="#0891b2" />
          ))}
        </Card>

        {/* ownership + registration */}
        <Card title="Ownership & registration">
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0 0 0.35rem' }}>Ownership</div>
          {ownDist.map(([label, v]) => (
            <Bar key={label} label={label} value={v} max={ownDist[0]?.[1] ?? 1} color="#334155" dense />
          ))}
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0.6rem 0 0.35rem' }}>Registration status</div>
          {regDist.map(([label, v]) => (
            <Bar key={label} label={shorten(label)} value={v} max={regDist[0]?.[1] ?? 1} color={/^Registered/i.test(label) ? TRAFFIC.green : TRAFFIC.amber} dense />
          ))}
        </Card>
      </div>
    </div>
  )
}

// ---- helpers ----------------------------------------------------------------
function uniq(xs: Array<string | null>): string[] {
  return Array.from(new Set(xs.filter((x): x is string => !!x))).sort()
}
function pct(n: number, d: number) { return d ? Math.round((n / d) * 100) : 0 }
function shorten(s: string) { return s.length > 30 ? s.slice(0, 29) + '…' : s }
function barColor(m: number | null) { return m == null ? '#cbd5e1' : m < 2 ? TRAFFIC.red : m < 2.5 ? TRAFFIC.amber : TRAFFIC.green }

function kpis(cs: RubricCentre[]) {
  const scored = cs.filter((c) => c.infra_score != null)
  const tierScored: Record<string, number> = {}
  for (const c of scored) { const t = tierShort(c.tier); tierScored[t] = (tierScored[t] ?? 0) + 1 }
  const registered = cs.filter((c) => c.registration && /^Registered/i.test(c.registration)).length
  return {
    count: cs.length,
    children: sum(cs.map((c) => c.children_total)),
    councils: uniq(cs.map((c) => c.council)).length,
    capacity: mean(cs.map((c) => c.capacity_score)),
    pctRegistered: pct(registered, cs.length),
    medFee: median(cs.map((c) => c.monthly_fee)),
    capacityScoredN: cs.filter((c) => c.capacity_score != null).length,
    tierScored,
    tierScoredN: scored.length,
    tierPending: cs.length - scored.length
  }
}
function scoreBands(scores: Array<number | null>): Array<{ label: string; n: number }> {
  const defs = [
    { label: 'Below 40', min: -Infinity, max: 40 },
    { label: '40–59', min: 40, max: 60 },
    { label: '60–79', min: 60, max: 80 },
    { label: '80–100', min: 80, max: Infinity }
  ]
  const out = defs.map((d) => ({ label: d.label, n: 0 }))
  for (const v of scores) {
    if (v == null) continue
    const i = defs.findIndex((d) => v >= d.min && v < d.max)
    if (i >= 0) out[i].n++
  }
  return out
}
function scorecard(cs: RubricCentre[], defs: Array<{ key: string; en: string }>, pick: (c: RubricCentre) => Record<string, number | null>) {
  return defs
    .map((d) => ({ key: d.key, label: d.en, mean: mean(cs.map((c) => pick(c)?.[d.key])) }))
    .sort((a, b) => (a.mean ?? 99) - (b.mean ?? 99))
}
function countBy(cs: RubricCentre[], pick: (c: RubricCentre) => string | null): Array<[string, number]> {
  const m: Record<string, number> = {}
  for (const c of cs) { const v = pick(c); if (!v) continue; m[v] = (m[v] ?? 0) + 1 }
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}

// ---- UI atoms ---------------------------------------------------------------
function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: '0.45rem 0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', minWidth: 160, background: '#fff', color: 'var(--ink, #1a1a1a)' }}>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}
function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '0.9rem', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: accent ?? 'var(--primary-dark)', marginTop: '0.2rem' }}>{value}</div>
    </div>
  )
}
function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '1.1rem', boxShadow: 'var(--shadow)' }}>
      <h4 style={{ fontSize: '0.98rem', margin: 0, color: 'var(--primary-dark)' }}>{title}</h4>
      {subtitle && <p style={{ fontSize: '0.76rem', color: 'var(--muted)', margin: '0.2rem 0 0.9rem' }}>{subtitle}</p>}
      {!subtitle && <div style={{ height: '0.7rem' }} />}
      {children}
    </div>
  )
}
function Bar({ label, value, max, color, suffix = '', dense = false }: { label: string; value: number; max: number; color: string; suffix?: string; dense?: boolean }) {
  const w = Math.max(2, Math.min(100, (value / (max || 1)) * 100))
  return (
    <div style={{ marginBottom: dense ? '0.32rem' : '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: dense ? '0.74rem' : '0.82rem', marginBottom: 2 }}>
        <span style={{ color: 'var(--ink, #1a1a1a)' }}>{label}</span>
        <strong style={{ color: 'var(--primary-dark)' }}>{Number.isInteger(value) ? value : value.toFixed(2)}{suffix}</strong>
      </div>
      <div style={{ background: '#eef2f7', borderRadius: 6, height: dense ? 6 : 9 }}>
        <div style={{ width: `${w}%`, background: color, height: '100%', borderRadius: 6 }} />
      </div>
    </div>
  )
}
function Empty() {
  return <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>No scored centres in this selection.</p>
}
