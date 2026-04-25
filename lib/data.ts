import { getSupabaseAdmin, isSupabaseConfigured } from './supabase/server'
import { FALLBACK_DASHBOARD, SEED_CENTRES, type SeedCentre } from './seed-data'
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

export interface DashboardSnapshot {
  totalMembers: number
  activeCentres: number
  avgQualityPct: number
  trainingsCompleted: number
  qualityDistribution: { green: number; amber: number; red: number }
  membershipGrowth: { labels: string[]; data: number[] }
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
  } catch {
    return SEED_FALLBACK_CENTRES()
  }
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!isSupabaseConfigured()) return FALLBACK_DASHBOARD.uviwada
  const supabase = getSupabaseAdmin()
  if (!supabase) return FALLBACK_DASHBOARD.uviwada

  try {
    type MemberRow = {
      id: string
      latest_quality: string | null
      license_status: string
      children_count: number
      joined_at: string
    }

    const { data } = await supabase
      .from('members')
      .select('id, latest_quality, license_status, children_count, joined_at')

    const members = (data ?? []) as MemberRow[]
    if (members.length === 0) return FALLBACK_DASHBOARD.uviwada

    const counts = { green: 0, amber: 0, red: 0 }
    for (const m of members) {
      const q = (m.latest_quality ?? 'amber') as QualityRating
      counts[q] += 1
    }

    const totalMembers = members.length
    const activeCentres = members.filter((m) => m.license_status !== 'expired').length
    const greenPct = totalMembers > 0 ? Math.round((counts.green / totalMembers) * 100) : 0

    const labels: string[] = []
    const series: number[] = []
    const now = new Date()
    for (let i = 8; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      labels.push(d.toLocaleString('en', { month: 'short' }))
      const cumulative = members.filter((m) => new Date(m.joined_at) < next).length
      series.push(cumulative)
    }

    const { count: trainingsCompleted } = await supabase
      .from('training_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'attended')

    return {
      totalMembers,
      activeCentres,
      avgQualityPct: greenPct,
      trainingsCompleted: trainingsCompleted ?? 0,
      qualityDistribution: counts,
      membershipGrowth: { labels, data: series }
    }
  } catch {
    return FALLBACK_DASHBOARD.uviwada
  }
}
