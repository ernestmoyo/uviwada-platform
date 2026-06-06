import { getSupabaseAdmin, isSupabaseConfigured } from './supabase/server'
import { SEED_CENTRES, type SeedCentre } from './seed-data'
import type { QualityRating } from './types/database'

export interface PublicCentre {
  id: string
  name: string
  ward: string
  district: string
  lat: number
  lng: number
  quality: QualityRating
  children: number
}

function seedToPublic(s: SeedCentre, idx: number): PublicCentre {
  return {
    id: `seed-${idx}`,
    name: s.name,
    ward: s.ward,
    district: s.district,
    lat: s.lat,
    lng: s.lng,
    quality: s.quality,
    children: s.children
  }
}

const SEED_FALLBACK_CENTRES = (): PublicCentre[] => SEED_CENTRES.map(seedToPublic)

export async function fetchPublicCentres(): Promise<PublicCentre[]> {
  if (!isSupabaseConfigured()) return SEED_FALLBACK_CENTRES()
  // Public homepage data — no user cookies required, use the cookieless admin
  // client so cookies()/RSC ordering can't break the render.
  const supabase = getSupabaseAdmin()
  if (!supabase) return SEED_FALLBACK_CENTRES()

  try {
    const { data, error } = await supabase
      .from('members')
      .select('id, centre_name, ward, district, lat, lng, latest_quality, children_count')
      .not('lat', 'is', null)
      .not('lng', 'is', null)

    type CentreRow = {
      id: string
      centre_name: string
      ward: string
      district: string
      lat: number | null
      lng: number | null
      latest_quality: string | null
      children_count: number
    }

    const rows = (data ?? []) as CentreRow[]
    if (error || rows.length === 0) return SEED_FALLBACK_CENTRES()

    return rows.map((m) => ({
      id: m.id,
      name: m.centre_name,
      ward: m.ward,
      district: m.district,
      lat: m.lat as number,
      lng: m.lng as number,
      quality: (m.latest_quality ?? 'green') as QualityRating,
      children: m.children_count
    }))
  } catch (err) {
    console.error('fetchPublicCentres: falling back to seed', err)
    return SEED_FALLBACK_CENTRES()
  }
}

