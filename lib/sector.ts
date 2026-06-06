// Single source of truth for the PUBLIC homepage's sector figures.
//
// Every number the public sees (hero counters, dashboard KPIs, council bars,
// tier distribution, infrastructure scorecard, map pins) is derived here from
// the real 234-centre rubric snapshot — never from hand-typed demo values.
// Pure module: safe on both server and client so the homepage dashboard can
// recompute these on a council filter without a round-trip.

import type { RubricCentre } from './rubric-data'
import type { PublicCentre } from './data'
import { INFRA_SUBDOMAINS, tierLabelToTrafficLight } from './rubric'
import type { QualityRating } from './types/database'

export type TierShort = 'Level 4' | 'Level 3' | 'Level 2' | 'Pending'

export interface SectorKpis {
  centres: number
  councils: number
  children: number
  careworkers: number
  girls: number
  boys: number
  disabilityCount: number
  meanCapacity: number | null
  capacityScoredN: number
  medianFee: number | null
  registeredPct: number
}

export interface NamedCount {
  label: string
  value: number
}

export interface ScoreRow {
  key: string
  label: string
  mean: number | null
}

export interface TierStats {
  scored: Record<'Level 4' | 'Level 3' | 'Level 2', number>
  scoredN: number
  pending: number
}

export interface SectorMapPoint {
  name: string
  lat: number
  lng: number
  council: string | null
  tier: string | null
  quality: QualityRating
}

// ---- numeric helpers --------------------------------------------------------
function nums(xs: Array<number | null | undefined>): number[] {
  return xs.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
}
export function mean(xs: Array<number | null | undefined>): number | null {
  const v = nums(xs)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}
export function median(xs: Array<number | null | undefined>): number | null {
  const v = nums(xs).sort((a, b) => a - b)
  return v.length ? v[Math.floor(v.length / 2)] : null
}
export function sum(xs: Array<number | null | undefined>): number {
  return nums(xs).reduce((a, b) => a + b, 0)
}
export function pct(n: number, d: number): number {
  return d ? Math.round((n / d) * 100) : 0
}

export function tierShort(t: string | null | undefined): TierShort {
  if (!t) return 'Pending'
  if (t.includes('Level 4')) return 'Level 4'
  if (t.includes('Level 3')) return 'Level 3'
  return 'Level 2'
}

// Progressive framing for each tier — the heart of the CiC PRIMER approach:
// quality is a stepping-stone pathway, not a pass/fail gate. A "Level 2" centre
// is *emerging and supported*, not *failing*. Keeps the platform supportive,
// never punitive (V2 §540).
export function tierMeaning(t: TierShort, sw: boolean): { title: string; note: string } {
  switch (t) {
    case 'Level 4':
      return {
        title: sw ? 'Kiwango cha juu kinacholengwa' : 'Highest intended standard',
        note: sw ? 'Kinakidhi kiwango cha ubora kinacholengwa.' : 'Meets the intended quality benchmark.'
      }
    case 'Level 3':
      return {
        title: sw ? 'Kiwango cha utendaji' : 'Functional standard',
        note: sw ? 'Ubora thabiti — kiko kwenye njia nzuri.' : 'Solid quality — well on the pathway.'
      }
    case 'Level 2':
      return {
        title: sw ? 'Kinachochipukia' : 'Emerging',
        note: sw
          ? 'Kiko kwenye njia ya kuboresha kwa msaada — si kufeli.'
          : 'On the improvement pathway with support — not failing.'
      }
    default:
      return {
        title: sw ? 'Tathmini inaendelea' : 'Assessment in progress',
        note: sw ? 'Alama kamili bado inasubiri.' : 'Full score still pending.'
      }
  }
}

function uniqCount(xs: Array<string | null>): number {
  return new Set(xs.filter((x): x is string => !!x)).size
}

// ---- aggregates -------------------------------------------------------------
export function computeKpis(cs: RubricCentre[]): SectorKpis {
  const registered = cs.filter((c) => c.registration && /^Registered/i.test(c.registration)).length
  return {
    centres: cs.length,
    councils: uniqCount(cs.map((c) => c.council)),
    children: sum(cs.map((c) => c.children_total)),
    careworkers: sum(cs.map((c) => c.staff_total)),
    girls: sum(cs.map((c) => c.girls)),
    boys: sum(cs.map((c) => c.boys)),
    disabilityCount: sum(cs.map((c) => c.disability_count)),
    meanCapacity: mean(cs.map((c) => c.capacity_score)),
    capacityScoredN: nums(cs.map((c) => c.capacity_score)).length,
    medianFee: median(cs.map((c) => c.monthly_fee)),
    registeredPct: pct(registered, cs.length)
  }
}

// Tier is only reported for centres whose infrastructure composite is scored —
// otherwise the field tool defaults them to "Level 4", which would overstate
// quality. We exclude the unscored from the distribution and surface them
// honestly as "pending".
export function tierStats(cs: RubricCentre[]): TierStats {
  const scoredCentres = cs.filter((c) => c.infra_score != null)
  const scored: TierStats['scored'] = { 'Level 4': 0, 'Level 3': 0, 'Level 2': 0 }
  for (const c of scoredCentres) {
    const t = tierShort(c.tier)
    if (t !== 'Pending') scored[t] += 1
  }
  return { scored, scoredN: scoredCentres.length, pending: cs.length - scoredCentres.length }
}

export function infraScorecard(cs: RubricCentre[]): ScoreRow[] {
  return INFRA_SUBDOMAINS.map((d) => ({
    key: d.key,
    label: d.en,
    mean: mean(cs.map((c) => c.infra?.[d.key]))
  })).sort((a, b) => (a.mean ?? 99) - (b.mean ?? 99))
}

export function capacityBands(cs: RubricCentre[]): NamedCount[] {
  const defs = [
    { label: 'Below 40', min: -Infinity, max: 40 },
    { label: '40–59', min: 40, max: 60 },
    { label: '60–79', min: 60, max: 80 },
    { label: '80–100', min: 80, max: Infinity }
  ]
  const out = defs.map((d) => ({ label: d.label, value: 0 }))
  for (const c of cs) {
    const v = c.capacity_score
    if (v == null) continue
    const i = defs.findIndex((d) => v >= d.min && v < d.max)
    if (i >= 0) out[i].value += 1
  }
  return out
}

export function countBy(cs: RubricCentre[], pick: (c: RubricCentre) => string | null): NamedCount[] {
  const m = new Map<string, number>()
  for (const c of cs) {
    const v = pick(c)
    if (!v) continue
    m.set(v, (m.get(v) ?? 0) + 1)
  }
  return Array.from(m.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export const councilDist = (cs: RubricCentre[]) => countBy(cs, (c) => c.council)
export const ownershipDist = (cs: RubricCentre[]) => countBy(cs, (c) => c.ownership)
export const registrationDist = (cs: RubricCentre[]) => countBy(cs, (c) => c.registration)

export function uniqueCouncils(cs: RubricCentre[]): string[] {
  return Array.from(new Set(cs.map((c) => c.council).filter((x): x is string => !!x))).sort()
}

export function mapPoints(cs: RubricCentre[]): SectorMapPoint[] {
  return cs
    .filter((c) => c.lat != null && c.lng != null)
    .map((c) => ({
      name: c.name,
      lat: c.lat as number,
      lng: c.lng as number,
      council: c.council,
      tier: c.tier,
      quality: tierLabelToTrafficLight(c.tier)
    }))
}

// Adapt the rich rubric centres into the lightweight shape the existing
// homepage Leaflet map (WardMap) already understands — so the public map keeps
// its ward overlay and clustering but plots the real 234 centres, coloured by
// quality tier.
export function rubricToPublicCentres(cs: RubricCentre[]): PublicCentre[] {
  return cs
    .filter((c) => c.lat != null && c.lng != null)
    .map((c, idx) => ({
      id: `rubric-${idx}`,
      name: c.name,
      ward: c.ward ?? c.council ?? 'Dar es Salaam',
      district: c.council ?? 'Dar es Salaam',
      lat: c.lat as number,
      lng: c.lng as number,
      quality: tierLabelToTrafficLight(c.tier),
      children: c.children_total ?? 0
    }))
}
