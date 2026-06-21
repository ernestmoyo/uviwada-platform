// Public directory + centre-profile view model, derived from the real rubric
// snapshot. Pure module (safe on client + server).
//
// Governance note: the 234 centres are field-assessment records, not yet
// consented public listings (V2 §330–341, PDPA §719–729). The directory and
// profile UIs therefore (a) carry a clear "preliminary / consent pending"
// disclaimer, (b) never invent contact details or photos, and (c) show only an
// APPROXIMATE location, never the exact GPS pin (§669). Real public-listing
// consent will gate these once the membership module lands.

import type { RubricCentre, RubricSnapshot } from './rubric-data'
import { tierLabelToTrafficLight } from './rubric'
import { tierShort, type TierShort } from './sector'

export interface DirectoryCentre {
  slug: string
  index: number
  name: string
  region: string | null
  council: string | null
  ward: string | null
  ownership: string | null
  registration: string | null
  tier: string | null
  tierShort: TierShort
  traffic: 'green' | 'amber' | 'red'
  scored: boolean
  children: number | null
  girls: number | null
  boys: number | null
  disability: number | null
  careworkers: number | null
  monthlyFee: number | null
  capacityScore: number | null
  infraScore: number | null
  lat: number | null
  lng: number | null
  capacity: Record<string, number | null>
  infra: Record<string, number | null>
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '') // strip combining diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'centre'
  )
}

export function toDirectoryCentre(c: RubricCentre, index: number): DirectoryCentre {
  return {
    slug: `${slugify(c.name)}--${index}`,
    index,
    name: c.name,
    region: c.region,
    council: c.council,
    ward: c.ward,
    ownership: c.ownership,
    registration: c.registration,
    tier: c.tier,
    tierShort: tierShort(c.tier),
    traffic: tierLabelToTrafficLight(c.tier),
    scored: c.infra_score != null,
    children: c.children_total,
    girls: c.girls,
    boys: c.boys,
    disability: c.disability_count,
    careworkers: c.staff_total,
    monthlyFee: c.monthly_fee,
    capacityScore: c.capacity_score,
    infraScore: c.infra_score,
    lat: c.lat,
    lng: c.lng,
    capacity: c.capacity ?? {},
    infra: c.infra ?? {}
  }
}

export function buildDirectory(snapshot: RubricSnapshot): DirectoryCentre[] {
  return snapshot.centres.map(toDirectoryCentre)
}

// The slug embeds the snapshot index, so profile lookup is O(1) and stable for
// a given data source.
export function findBySlug(snapshot: RubricSnapshot, slug: string): DirectoryCentre | null {
  const idx = Number.parseInt(slug.split('--').pop() ?? '', 10)
  if (Number.isNaN(idx)) return null
  const c = snapshot.centres[idx]
  return c ? toDirectoryCentre(c, idx) : null
}
