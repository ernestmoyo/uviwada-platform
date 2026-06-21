// Server-side rubric snapshot: prefer LIVE Supabase data (rubric_assessments),
// fall back to the committed preliminary extract so the dashboard always shows
// real figures (never simulated). Single shape consumed by the /quality page.

import { getSupabaseAdmin } from './supabase/server'
import fallback from './rubric-fallback.json'

export interface RubricCentre {
  name: string
  region: string | null
  council: string | null
  ward: string | null
  lat: number | null
  lng: number | null
  ownership: string | null
  registration: string | null
  tier: string | null
  capacity_score: number | null
  capacity_result: number | null
  infra_score: number | null
  infra_result: number | null
  monthly_fee: number | null
  children_total: number | null
  girls: number | null
  boys: number | null
  disability_count: number | null
  staff_total: number | null
  capacity: Record<string, number | null>
  infra: Record<string, number | null>
}

export interface RubricMeta {
  source: string
  totalRecords: number
  dataCompleteness: {
    total: number
    infra_scored: number
    capacity_scored: number
    tier_assigned: number
    gps_present: number
    date_from: string | null
    date_to: string | null
    note: string
  }
  rubricVersion: string
}

export interface RubricSnapshot {
  source: 'live' | 'fallback'
  meta: RubricMeta
  centres: RubricCentre[]
}

function rawToCentre(raw: Record<string, unknown>, tier: string | null): RubricCentre {
  const r = raw as Record<string, never>
  return {
    name: (r['name'] as unknown as string) ?? '—',
    region: (r['region'] as unknown as string) ?? null,
    council: (r['council'] as unknown as string) ?? null,
    ward: (r['ward'] as unknown as string) ?? null,
    lat: (r['lat'] as unknown as number) ?? null,
    lng: (r['lng'] as unknown as number) ?? null,
    ownership: (r['ownership_type'] as unknown as string) ?? null,
    registration: (r['registration_status'] as unknown as string) ?? null,
    tier: tier ?? (r['infra_tier'] as unknown as string) ?? null,
    capacity_score: (r['capacity_score'] as unknown as number) ?? null,
    capacity_result: (r['capacity_result'] as unknown as number) ?? null,
    infra_score: (r['infra_score'] as unknown as number) ?? null,
    infra_result: (r['infra_result'] as unknown as number) ?? null,
    monthly_fee: (r['monthly_fee'] as unknown as number) ?? null,
    children_total: (r['children_total'] as unknown as number) ?? null,
    girls: (r['girls'] as unknown as number) ?? null,
    boys: (r['boys'] as unknown as number) ?? null,
    disability_count: (r['disability_count'] as unknown as number) ?? null,
    staff_total: (r['staff_total'] as unknown as number) ?? null,
    capacity: (r['capacity'] as unknown as Record<string, number | null>) ?? {},
    infra: (r['infra'] as unknown as Record<string, number | null>) ?? {}
  }
}

const FALLBACK_SNAPSHOT: RubricSnapshot = {
  source: 'fallback',
  meta: fallback.meta as RubricMeta,
  centres: (fallback.centres as unknown) as RubricCentre[]
}

export async function fetchRubricSnapshot(): Promise<RubricSnapshot> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return FALLBACK_SNAPSHOT
  try {
    const { data, error } = await supabase
      .from('rubric_assessments')
      .select('infra_tier, raw')
      .limit(2000)
    if (error || !data || data.length === 0) return FALLBACK_SNAPSHOT

    const centres = data
      .map((row) => {
        const raw = (row as { raw: Record<string, unknown> | null }).raw
        if (!raw) return null
        return rawToCentre(raw, (row as { infra_tier: string | null }).infra_tier)
      })
      .filter((c): c is RubricCentre => c !== null)

    if (centres.length === 0) return FALLBACK_SNAPSHOT

    const infraScored = centres.filter((c) => c.infra_score != null).length
    const capScored = centres.filter((c) => c.capacity_score != null).length
    const gps = centres.filter((c) => c.lat != null && c.lng != null).length

    return {
      source: 'live',
      meta: {
        ...FALLBACK_SNAPSHOT.meta,
        source: 'live (Supabase)',
        totalRecords: centres.length,
        dataCompleteness: {
          ...FALLBACK_SNAPSHOT.meta.dataCompleteness,
          total: centres.length,
          infra_scored: infraScored,
          capacity_scored: capScored,
          gps_present: gps
        }
      },
      centres
    }
  } catch {
    return FALLBACK_SNAPSHOT
  }
}
