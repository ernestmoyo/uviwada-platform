import { getSupabaseAdmin, isSupabaseConfigured } from './supabase/server'
import {
  buildDemoTenantStats,
  DEMO_ANNOUNCEMENTS,
  DEMO_TRAININGS,
  listDemoMembersForOrg
} from './demo-fallback'
import { DEFAULT_TENANT_ID, isNationalTenant } from './tenant-presets'
import type { LicenseStatus, QualityRating } from './types/database'

// The national tenant aggregates every region, so its admin queries must span
// all orgs (no org_id filter). Regional tenants filter to their own org.

export type MembershipStatus = 'pending' | 'approved' | 'rejected'

export interface AdminMember {
  id: string
  centre_name: string
  region: string | null
  ward: string
  district: string
  phone: string
  email: string | null
  children_count: number
  caregiver_count: number
  license_status: LicenseStatus
  license_number: string | null
  license_expiry: string | null
  latest_quality: QualityRating | null
  membership_status: MembershipStatus
  joined_at: string
}

export interface TrainingEnrolment {
  member_id: string
  member_name: string
  status: string
  registered_at: string | null
}

export interface AdminTraining {
  id: string
  title_sw: string
  title_en: string
  category: string
  scheduled_at: string
  location: string
  capacity: number
  facilitator: string | null
  // Minimum enrolments before the facilitator confirms the training runs.
  min_participants: number
  // 'published' (open for registration) | 'confirmed' (going ahead) | 'cancelled'.
  status: string
  registered_count: number
  // The DCCs enrolled in this training (empty in the no-Supabase demo).
  registrations: TrainingEnrolment[]
}

// A DCC-submitted request for a future training topic (secretariat reviews these).
export interface AdminTrainingRequest {
  id: string
  member_id: string
  member_name: string
  category: string | null
  topic: string | null
  note: string | null
  status: string
  created_at: string | null
}

export interface AdminAssessment {
  id: string
  member_id: string
  member_name: string
  conducted_at: string
  rating: QualityRating
  score_total: number
  score_max: number
  source: string
}

// A row from the NATIVE rubric store (rubric_assessments) — what the web rubric
// form (/api/rubric-assessments) and the field app sync (/api/sync) both write.
// Distinct from the legacy `assessments` table (AdminAssessment above).
export interface AdminRubricAssessment {
  id: string
  member_id: string
  member_name: string
  assessed_on: string
  assessment_type: string | null
  infra_tier: string | null
  infra_score: number | null
  capacity_score: number | null
  source: string
}

export interface AdminAnnouncement {
  id: string
  title_sw: string
  title_en: string
  body_sw: string
  body_en: string
  published_at: string
}

export interface AdminTenantStats {
  total_members: number
  active_centres: number
  pct_green: number
  pct_amber: number
  pct_red: number
  trainings_upcoming: number
  trainings_attended: number
  expired_licences: number
  expiring_30d: number
  total_children: number
  by_ward: Array<{ ward: string; count: number }>
  by_district: Array<{ district: string; count: number }>
  membership_growth: { labels: string[]; data: number[] }
}

interface MemberRow {
  id: string
  centre_name: string
  region: string | null
  ward: string
  district: string
  phone: string
  email: string | null
  children_count: number
  caregiver_count: number
  license_status: LicenseStatus
  license_number: string | null
  license_expiry: string | null
  latest_quality: QualityRating | null
  membership_status: MembershipStatus | null
  joined_at: string
}

export async function fetchMembersForOrg(orgId: string): Promise<AdminMember[]> {
  if (!isSupabaseConfigured()) return listDemoMembersForOrg(orgId)
  const supabase = getSupabaseAdmin()
  if (!supabase) return listDemoMembersForOrg(orgId)
  const national = isNationalTenant(orgId)
  try {
    // Base columns only — does NOT reference membership_status, so the real
    // member list still loads even if migration 0005 hasn't been applied yet.
    let baseQ = supabase
      .from('members')
      .select(
        'id, centre_name, region, ward, district, phone, email, children_count, caregiver_count, license_status, license_number, license_expiry, latest_quality, joined_at'
      )
    if (!national) baseQ = baseQ.eq('org_id', orgId)
    const { data } = await baseQ.order('centre_name')
    const rows = (data ?? []) as Omit<MemberRow, 'membership_status'>[]
    if (rows.length === 0) return listDemoMembersForOrg(orgId)

    // Best-effort overlay of membership_status. If the column is absent
    // (pre-migration), this query yields nothing and every centre defaults to
    // 'approved' so the table still renders normally.
    const statusById = new Map<string, MembershipStatus>()
    let statusQ = supabase.from('members').select('id, membership_status')
    if (!national) statusQ = statusQ.eq('org_id', orgId)
    const { data: statusRows } = await statusQ
    ;((statusRows ?? []) as Array<{ id: string; membership_status: MembershipStatus | null }>).forEach((s) => {
      if (s.membership_status) statusById.set(s.id, s.membership_status)
    })

    return rows.map((r) => ({ ...r, membership_status: statusById.get(r.id) ?? 'approved' }))
  } catch {
    return listDemoMembersForOrg(orgId)
  }
}

/**
 * Members an assessor may assess.
 *
 * Assessors can assess ANY registered centre (not just their home ward/org), so
 * this mirrors the mobile field feed (/api/field/centres): every REAL member,
 * across all orgs, with NO org filter. Crucially, when Supabase is configured we
 * NEVER fall back to demo centres — their synthetic UUIDs are not present in
 * `members`, so submitting one triggers rubric_assessments_member_id_fkey. If
 * the live DB genuinely has no members we return an empty list so the UI can say
 * "no centres to assess" instead of offering un-saveable demo rows.
 *
 * Demo centres are only returned when Supabase is absent (pure no-secrets demo,
 * where saving is disabled anyway), keeping web and mobile in sync on real data.
 */
export async function fetchAssessableMembers(): Promise<AdminMember[]> {
  if (!isSupabaseConfigured()) return listDemoMembersForOrg(DEFAULT_TENANT_ID)
  const supabase = getSupabaseAdmin()
  if (!supabase) return listDemoMembersForOrg(DEFAULT_TENANT_ID)
  try {
    const { data } = await supabase
      .from('members')
      .select(
        'id, centre_name, region, ward, district, phone, email, children_count, caregiver_count, license_status, license_number, license_expiry, latest_quality, joined_at'
      )
      .order('centre_name')
    const rows = (data ?? []) as Omit<MemberRow, 'membership_status'>[]
    // Real DB, real UUIDs only — no demo fallback here.
    return rows.map((r) => ({ ...r, membership_status: 'approved' as MembershipStatus }))
  } catch {
    return []
  }
}

export async function fetchTrainingsForOrg(orgId: string): Promise<AdminTraining[]> {
  if (!isSupabaseConfigured()) return DEMO_TRAININGS
  const supabase = getSupabaseAdmin()
  if (!supabase) return DEMO_TRAININGS
  try {
    let trainingsQ = supabase
      .from('trainings')
      .select('id, title_sw, title_en, category, scheduled_at, location, capacity, facilitator, min_participants, status')
    if (!isNationalTenant(orgId)) trainingsQ = trainingsQ.eq('org_id', orgId)
    const { data: trainings } = await trainingsQ.order('scheduled_at', { ascending: false })

    const trs = (trainings ?? []) as Array<Omit<AdminTraining, 'registered_count'>>
    if (trs.length === 0) return DEMO_TRAININGS

    const ids = trs.map((t) => t.id)
    const { data: regs } = await supabase
      .from('training_registrations')
      .select('training_id, member_id, status, registered_at, members(centre_name)')
      .in('training_id', ids)
      .order('registered_at', { ascending: true })
    type RegJoin = {
      training_id: string
      member_id: string
      status: string
      registered_at: string | null
      members: { centre_name: string } | { centre_name: string }[] | null
    }
    const roster = new Map<string, TrainingEnrolment[]>()
    ;((regs ?? []) as unknown as RegJoin[]).forEach((r) => {
      const m = Array.isArray(r.members) ? r.members[0] : r.members
      const list = roster.get(r.training_id) ?? []
      list.push({
        member_id: r.member_id,
        member_name: m?.centre_name ?? 'Unknown centre',
        status: r.status,
        registered_at: r.registered_at
      })
      roster.set(r.training_id, list)
    })

    return trs.map((t) => {
      const registrations = roster.get(t.id) ?? []
      return { ...t, registered_count: registrations.length, registrations }
    })
  } catch {
    return DEMO_TRAININGS
  }
}

// DCC-submitted training requests, newest first (secretariat reviews these).
export async function fetchTrainingRequestsForOrg(orgId: string, limit = 30): Promise<AdminTrainingRequest[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  try {
    const { data } = await supabase
      .from('training_requests')
      .select('id, member_id, category, topic, note, status, created_at, org_id, members(centre_name, org_id)')
      .order('created_at', { ascending: false })
      .limit(limit)
    type ReqJoin = {
      id: string
      member_id: string
      category: string | null
      topic: string | null
      note: string | null
      status: string
      created_at: string | null
      org_id: string | null
      members: { centre_name: string; org_id: string } | { centre_name: string; org_id: string }[] | null
    }
    const rows = (data ?? []) as unknown as ReqJoin[]
    return rows
      .map((r) => {
        const m = Array.isArray(r.members) ? r.members[0] : r.members
        return { r, orgId: r.org_id ?? m?.org_id ?? null, name: m?.centre_name ?? 'Unknown centre' }
      })
      .filter((x) => isNationalTenant(orgId) || x.orgId === orgId)
      .map((x) => ({
        id: x.r.id,
        member_id: x.r.member_id,
        member_name: x.name,
        category: x.r.category,
        topic: x.r.topic,
        note: x.r.note,
        status: x.r.status,
        created_at: x.r.created_at
      }))
  } catch {
    return []
  }
}

export async function fetchAssessmentsForOrg(orgId: string, limit = 50): Promise<AdminAssessment[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  try {
    const { data } = await supabase
      .from('assessments')
      .select('id, member_id, conducted_at, rating, score_total, score_max, source, members(centre_name, org_id)')
      .order('conducted_at', { ascending: false })
      .limit(limit)
    type AssessmentJoin = {
      id: string
      member_id: string
      conducted_at: string
      rating: QualityRating
      score_total: number
      score_max: number
      source: string
      // Supabase types `members` as an array on a join; in practice it's a single
      // row because of the FK, but the type allows both shapes.
      members: { centre_name: string; org_id: string } | { centre_name: string; org_id: string }[] | null
    }
    const rows = (data ?? []) as unknown as AssessmentJoin[]
    return rows
      .map((r) => {
        const memberRow = Array.isArray(r.members) ? r.members[0] : r.members
        return memberRow ? { row: r, memberRow } : null
      })
      .filter((x): x is { row: AssessmentJoin; memberRow: { centre_name: string; org_id: string } } => !!x)
      .filter((x) => isNationalTenant(orgId) || x.memberRow.org_id === orgId)
      .map((x) => ({
        id: x.row.id,
        member_id: x.row.member_id,
        member_name: x.memberRow.centre_name,
        conducted_at: x.row.conducted_at,
        rating: x.row.rating,
        score_total: x.row.score_total,
        score_max: x.row.score_max,
        source: x.row.source
      }))
  } catch {
    return []
  }
}

// Recent rubric assessments (web form + field-app sync), newest first. This is
// the list that shows a field assessment the moment it syncs — the legacy
// fetchAssessmentsForOrg reads a different table and won't include these.
export async function fetchRubricAssessmentsForOrg(orgId: string, limit = 30): Promise<AdminRubricAssessment[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  try {
    const { data } = await supabase
      .from('rubric_assessments')
      .select('id, member_id, assessed_on, assessment_type, infra_tier, infra_score, capacity_score, source, members(centre_name, org_id)')
      .order('assessed_on', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit)
    type RubricJoin = {
      id: string
      member_id: string
      assessed_on: string
      assessment_type: string | null
      infra_tier: string | null
      infra_score: number | null
      capacity_score: number | null
      source: string
      members: { centre_name: string; org_id: string } | { centre_name: string; org_id: string }[] | null
    }
    const rows = (data ?? []) as unknown as RubricJoin[]
    return rows
      .map((r) => {
        const memberRow = Array.isArray(r.members) ? r.members[0] : r.members
        return memberRow ? { row: r, memberRow } : null
      })
      .filter((x): x is { row: RubricJoin; memberRow: { centre_name: string; org_id: string } } => !!x)
      .filter((x) => isNationalTenant(orgId) || x.memberRow.org_id === orgId)
      .map((x) => ({
        id: x.row.id,
        member_id: x.row.member_id,
        member_name: x.memberRow.centre_name,
        assessed_on: x.row.assessed_on,
        assessment_type: x.row.assessment_type,
        infra_tier: x.row.infra_tier,
        infra_score: x.row.infra_score,
        capacity_score: x.row.capacity_score,
        source: x.row.source
      }))
  } catch {
    return []
  }
}

// A single centre's most recent rubric assessment (web form or field-app sync),
// so the member-detail page can surface "Latest quality assessment: <date> · <tier>".
export type LatestRubricAssessment = Omit<AdminRubricAssessment, 'member_name'>

export async function fetchLatestRubricAssessment(memberId: string): Promise<LatestRubricAssessment | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = getSupabaseAdmin()
  if (!supabase) return null
  try {
    const { data } = await supabase
      .from('rubric_assessments')
      .select('id, member_id, assessed_on, assessment_type, infra_tier, infra_score, capacity_score, source')
      .eq('member_id', memberId)
      .order('assessed_on', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (data as LatestRubricAssessment | null) ?? null
  } catch {
    return null
  }
}

export async function fetchAnnouncementsForOrg(orgId: string): Promise<AdminAnnouncement[]> {
  if (!isSupabaseConfigured()) return DEMO_ANNOUNCEMENTS
  const supabase = getSupabaseAdmin()
  if (!supabase) return DEMO_ANNOUNCEMENTS
  try {
    let annQ = supabase
      .from('announcements')
      .select('id, title_sw, title_en, body_sw, body_en, published_at')
    if (!isNationalTenant(orgId)) annQ = annQ.eq('org_id', orgId)
    const { data } = await annQ.order('published_at', { ascending: false })
    const rows = (data ?? []) as AdminAnnouncement[]
    return rows.length > 0 ? rows : DEMO_ANNOUNCEMENTS
  } catch {
    return DEMO_ANNOUNCEMENTS
  }
}

export async function fetchTenantStats(orgId: string): Promise<AdminTenantStats> {
  if (!isSupabaseConfigured()) return buildDemoTenantStats(orgId)
  const supabase = getSupabaseAdmin()
  if (!supabase) return buildDemoTenantStats(orgId)
  const national = isNationalTenant(orgId)
  try {
    let memberStatsQ = supabase
      .from('members')
      .select('id, ward, district, latest_quality, license_status, license_expiry, children_count, joined_at')
    if (!national) memberStatsQ = memberStatsQ.eq('org_id', orgId)
    const { data: memberRows } = await memberStatsQ
    const members = (memberRows ?? []) as Array<{
      id: string
      ward: string
      district: string
      latest_quality: QualityRating | null
      license_status: LicenseStatus
      license_expiry: string | null
      children_count: number
      joined_at: string
    }>

    if (members.length === 0) return buildDemoTenantStats(orgId)

    const total = members.length
    const counts = { green: 0, amber: 0, red: 0 }
    let totalChildren = 0
    let active = 0
    let expired = 0
    let expiring30 = 0
    const byWard = new Map<string, number>()
    const byDistrict = new Map<string, number>()
    const today = Date.now()

    for (const m of members) {
      const q = (m.latest_quality ?? 'amber') as QualityRating
      counts[q] += 1
      totalChildren += m.children_count ?? 0
      if (m.license_status !== 'expired') active += 1
      if (m.license_status === 'expired') expired += 1
      if (m.license_expiry) {
        const days = Math.ceil((new Date(m.license_expiry).getTime() - today) / 86_400_000)
        if (days >= 0 && days <= 30) expiring30 += 1
      }
      byWard.set(m.ward, (byWard.get(m.ward) ?? 0) + 1)
      byDistrict.set(m.district, (byDistrict.get(m.district) ?? 0) + 1)
    }

    // Trainings (upcoming + completed) — scoped per tenant (all orgs if national)
    const nowIso = new Date().toISOString()
    let upcomingQ = supabase.from('trainings').select('id', { count: 'exact', head: true }).gte('scheduled_at', nowIso)
    let allTrainingsQ = supabase.from('trainings').select('id')
    if (!national) {
      upcomingQ = upcomingQ.eq('org_id', orgId)
      allTrainingsQ = allTrainingsQ.eq('org_id', orgId)
    }
    const [{ count: upcoming }, { data: orgTrainings }] = await Promise.all([upcomingQ, allTrainingsQ])
    let attended = 0
    if (orgTrainings && orgTrainings.length > 0) {
      const ids = (orgTrainings as Array<{ id: string }>).map((t) => t.id)
      const { count } = await supabase
        .from('training_registrations')
        .select('id', { count: 'exact', head: true })
        .in('training_id', ids)
        .eq('status', 'attended')
      attended = count ?? 0
    }

    // Membership growth — trailing 9 months
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

    return {
      total_members: total,
      active_centres: active,
      pct_green: Math.round((counts.green / total) * 100),
      pct_amber: Math.round((counts.amber / total) * 100),
      pct_red: Math.round((counts.red / total) * 100),
      trainings_upcoming: upcoming ?? 0,
      trainings_attended: attended,
      expired_licences: expired,
      expiring_30d: expiring30,
      total_children: totalChildren,
      by_ward: Array.from(byWard.entries())
        .map(([ward, count]) => ({ ward, count }))
        .sort((a, b) => b.count - a.count),
      by_district: Array.from(byDistrict.entries())
        .map(([district, count]) => ({ district, count }))
        .sort((a, b) => b.count - a.count),
      membership_growth: { labels, data: series }
    }
  } catch {
    return buildDemoTenantStats(orgId)
  }
}

export function membersToCsv(members: AdminMember[]): string {
  const header = [
    'Centre name',
    'Ward',
    'District',
    'Phone',
    'Email',
    'Children',
    'Caregivers',
    'License status',
    'License number',
    'License expiry',
    'Latest quality',
    'Joined'
  ]
  const rows = members.map((m) => [
    m.centre_name,
    m.ward,
    m.district,
    m.phone,
    m.email ?? '',
    m.children_count,
    m.caregiver_count,
    m.license_status,
    m.license_number ?? '',
    m.license_expiry ?? '',
    m.latest_quality ?? '',
    m.joined_at.slice(0, 10)
  ])
  return [header, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n')
}

function escapeCsv(value: unknown): string {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}
