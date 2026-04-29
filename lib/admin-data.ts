import { getSupabaseAdmin, isSupabaseConfigured } from './supabase/server'
import {
  buildDemoTenantStats,
  DEMO_ANNOUNCEMENTS,
  DEMO_TRAININGS,
  listDemoMembersForOrg
} from './demo-fallback'
import type { LicenseStatus, QualityRating } from './types/database'

export interface AdminMember {
  id: string
  centre_name: string
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
  joined_at: string
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
  registered_count: number
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
  joined_at: string
}

export async function fetchMembersForOrg(orgId: string): Promise<AdminMember[]> {
  if (!isSupabaseConfigured()) return listDemoMembersForOrg(orgId)
  const supabase = getSupabaseAdmin()
  if (!supabase) return listDemoMembersForOrg(orgId)
  try {
    const { data } = await supabase
      .from('members')
      .select(
        'id, centre_name, ward, district, phone, email, children_count, caregiver_count, license_status, license_number, license_expiry, latest_quality, joined_at'
      )
      .eq('org_id', orgId)
      .order('centre_name')
    const rows = (data ?? []) as MemberRow[]
    if (rows.length === 0) return listDemoMembersForOrg(orgId)
    return rows
  } catch {
    return listDemoMembersForOrg(orgId)
  }
}

export async function fetchTrainingsForOrg(orgId: string): Promise<AdminTraining[]> {
  if (!isSupabaseConfigured()) return DEMO_TRAININGS
  const supabase = getSupabaseAdmin()
  if (!supabase) return DEMO_TRAININGS
  try {
    const { data: trainings } = await supabase
      .from('trainings')
      .select('id, title_sw, title_en, category, scheduled_at, location, capacity, facilitator')
      .eq('org_id', orgId)
      .order('scheduled_at', { ascending: false })

    const trs = (trainings ?? []) as Array<Omit<AdminTraining, 'registered_count'>>
    if (trs.length === 0) return DEMO_TRAININGS

    const ids = trs.map((t) => t.id)
    const { data: regs } = await supabase
      .from('training_registrations')
      .select('training_id')
      .in('training_id', ids)
    const counts = new Map<string, number>()
    ;((regs ?? []) as Array<{ training_id: string }>).forEach((r) => {
      counts.set(r.training_id, (counts.get(r.training_id) ?? 0) + 1)
    })

    return trs.map((t) => ({ ...t, registered_count: counts.get(t.id) ?? 0 }))
  } catch {
    return DEMO_TRAININGS
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
      .filter((x) => x.memberRow.org_id === orgId)
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

export async function fetchAnnouncementsForOrg(orgId: string): Promise<AdminAnnouncement[]> {
  if (!isSupabaseConfigured()) return DEMO_ANNOUNCEMENTS
  const supabase = getSupabaseAdmin()
  if (!supabase) return DEMO_ANNOUNCEMENTS
  try {
    const { data } = await supabase
      .from('announcements')
      .select('id, title_sw, title_en, body_sw, body_en, published_at')
      .eq('org_id', orgId)
      .order('published_at', { ascending: false })
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
  try {
    const { data: memberRows } = await supabase
      .from('members')
      .select('id, ward, district, latest_quality, license_status, license_expiry, children_count, joined_at')
      .eq('org_id', orgId)
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

    // Trainings (upcoming + completed) — query with org filter
    const nowIso = new Date().toISOString()
    const [{ count: upcoming }, { data: orgTrainings }] = await Promise.all([
      supabase
        .from('trainings')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('scheduled_at', nowIso),
      supabase.from('trainings').select('id').eq('org_id', orgId)
    ])
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
