import { getSupabaseAdmin, isSupabaseConfigured } from './supabase/server'
import { buildDemoPortalSnapshot } from './demo-fallback'
import type { QualityRating, QualityDimension } from './types/database'

export interface MyCentre {
  id: string
  centre_name: string
  ward: string
  district: string
  address: string | null
  phone: string
  email: string | null
  children_count: number
  caregiver_count: number
  age_band_0_2: number
  age_band_3_4: number
  age_band_5_6: number
  license_status: string
  license_number: string | null
  license_expiry: string | null
  joined_at: string
  latest_quality: QualityRating | null
}

export interface UpcomingTraining {
  id: string
  title_sw: string
  title_en: string
  category: string
  scheduled_at: string
  location: string
  capacity: number
  facilitator: string | null
  status: string
  registered: boolean
  isNew: boolean
}

export interface PortalAnnouncement {
  id: string
  title_sw: string
  title_en: string
  body_sw: string
  body_en: string
  published_at: string
  isNew: boolean
}

export interface RecommendedTraining {
  id: string
  title_sw: string
  title_en: string
  reason_sw: string
  reason_en: string
}

export interface PortalSnapshot {
  centre: MyCentre | null
  upcoming: UpcomingTraining[]
  announcements: PortalAnnouncement[]
  recommended: RecommendedTraining[]
  weakDimensions: QualityDimension[]
  // Count of trainings + announcements posted since the DCC last opened the portal.
  newCount: number
}

const DIMENSION_LABELS: Record<QualityDimension, { sw: string; en: string }> = {
  infrastructure: { sw: 'Miundombinu', en: 'Infrastructure' },
  staffing: { sw: 'Wafanyakazi', en: 'Staffing' },
  curriculum: { sw: 'Mtaala', en: 'Curriculum' },
  health_hygiene: { sw: 'Afya na Usafi', en: 'Health & Hygiene' },
  safeguarding: { sw: 'Ulinzi wa Mtoto', en: 'Safeguarding' },
  nutrition: { sw: 'Lishe', en: 'Nutrition' }
}

export async function fetchPortalSnapshot(memberId: string): Promise<PortalSnapshot> {
  if (!isSupabaseConfigured()) return buildDemoPortalSnapshot(memberId)
  const supabase = getSupabaseAdmin()
  if (!supabase) return buildDemoPortalSnapshot(memberId)

  const { data: centreRow } = await supabase
    .from('members')
    .select(
      'id, centre_name, ward, district, address, phone, email, children_count, caregiver_count, age_band_0_2, age_band_3_4, age_band_5_6, license_status, license_number, license_expiry, joined_at, latest_quality, org_id, portal_last_seen_at'
    )
    .eq('id', memberId)
    .single()

  if (!centreRow) return buildDemoPortalSnapshot(memberId)
  const centre = (centreRow as MyCentre & { org_id?: string }) ?? null
  const orgId = (centreRow as { org_id?: string } | null)?.org_id
  // Everything posted after this instant is flagged "new" for this visit. We read
  // it BEFORE stamping the current visit below.
  const lastSeen = (centreRow as { portal_last_seen_at?: string | null }).portal_last_seen_at ?? null
  const isNewer = (iso: string | null | undefined) => !!iso && (!lastSeen || iso > lastSeen)

  let upcoming: UpcomingTraining[] = []
  let announcements: PortalAnnouncement[] = []
  let recommended: RecommendedTraining[] = []
  let weakDimensions: QualityDimension[] = []
  let newCount = 0

  if (orgId) {
    const { data: trainingRows } = await supabase
      .from('trainings')
      .select('id, title_sw, title_en, category, scheduled_at, location, capacity, facilitator, status, created_at')
      .eq('org_id', orgId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(6)

    const { data: regRows } = await supabase
      .from('training_registrations')
      .select('training_id')
      .eq('member_id', memberId)
    const registeredSet = new Set(((regRows ?? []) as Array<{ training_id: string }>).map((r) => r.training_id))

    upcoming = ((trainingRows ?? []) as Array<Record<string, unknown>>).map((t) => ({
      id: t.id as string,
      title_sw: t.title_sw as string,
      title_en: t.title_en as string,
      category: t.category as string,
      scheduled_at: t.scheduled_at as string,
      location: t.location as string,
      capacity: (t.capacity as number) ?? 0,
      facilitator: (t.facilitator as string | null) ?? null,
      status: (t.status as string) ?? 'published',
      registered: registeredSet.has(t.id as string),
      isNew: isNewer(t.created_at as string | null)
    }))

    const { data: annRows } = await supabase
      .from('announcements')
      .select('id, title_sw, title_en, body_sw, body_en, published_at')
      .eq('org_id', orgId)
      .order('published_at', { ascending: false })
      .limit(5)
    announcements = ((annRows ?? []) as Array<Omit<PortalAnnouncement, 'isNew'>>).map((a) => ({
      ...a,
      isNew: isNewer(a.published_at)
    }))

    newCount = upcoming.filter((t) => t.isNew).length + announcements.filter((a) => a.isNew).length
    // Stamp this visit so the same items aren't "new" next time.
    await supabase.from('members').update({ portal_last_seen_at: new Date().toISOString() }).eq('id', memberId)

    // Recommended trainings: any dimensions where the centre's most recent
    // assessment scored below the dimension average. Phase-2 will replace this
    // SQL join with a proper recommendation engine.
    const { data: latestAssessment } = await supabase
      .from('assessments')
      .select('id, rating')
      .eq('member_id', memberId)
      .order('conducted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const latestRating = (latestAssessment as { rating?: QualityRating } | null)?.rating
    if (latestRating === 'red' || latestRating === 'amber') {
      const { data: weakRows } = await supabase
        .from('quality_indicator_scores')
        .select('dimension, passed')
        .eq('assessment_id', (latestAssessment as { id: string }).id)
      const dimsFailedCount = new Map<string, number>()
      ;((weakRows ?? []) as Array<{ dimension: string; passed: boolean }>).forEach((r) => {
        if (!r.passed) dimsFailedCount.set(r.dimension, (dimsFailedCount.get(r.dimension) ?? 0) + 1)
      })
      weakDimensions = Array.from(dimsFailedCount.entries())
        .filter(([, n]) => n >= 2)
        .map(([d]) => d as QualityDimension)

      if (weakDimensions.length > 0) {
        const { data: matchTrainings } = await supabase
          .from('trainings')
          .select('id, title_sw, title_en, category')
          .in('category', weakDimensions)
          .order('scheduled_at', { ascending: true })
        recommended = ((matchTrainings ?? []) as Array<{ id: string; title_sw: string; title_en: string; category: string }>).map(
          (t) => {
            const lab = DIMENSION_LABELS[t.category as QualityDimension] ?? { sw: t.category, en: t.category }
            return {
              id: t.id,
              title_sw: t.title_sw,
              title_en: t.title_en,
              reason_sw: `Imependekezwa kwa udhaifu katika eneo la ${lab.sw}.`,
              reason_en: `Recommended because of weakness in the ${lab.en} dimension.`
            }
          }
        )
      }
    }
  }

  return { centre, upcoming, announcements, recommended, weakDimensions, newCount }
}

export function dimensionLabel(dim: QualityDimension): { sw: string; en: string } {
  return DIMENSION_LABELS[dim]
}
