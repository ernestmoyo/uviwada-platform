// Self-contained demo data layer used when Supabase env vars are missing.
// Mirrors the shapes the rest of the app expects from the real DB so every
// page (login picker, /portal, /admin, /dashboard) renders without secrets.

import { SEED_CENTRES, SIX_TRAININGS, type SeedCentre } from './seed-data'
import { SEED_USER_PRESETS, type DemoRole } from './auth-presets'
import { TENANT_PRESETS } from './tenant-presets'
import type { DemoUser } from './auth'
import type { AdminMember, AdminTenantStats, AdminTraining, AdminAnnouncement } from './admin-data'
import type {
  MyCentre,
  PortalAnnouncement,
  PortalSnapshot,
  RecommendedTraining,
  UpcomingTraining
} from './portal-data'
import type { LicenseStatus, QualityRating } from './types/database'

const DAR_ORG_ID = TENANT_PRESETS[0].id // UVIWADA-DAR

// Stable synthetic UUIDs derived from the seed-centre index. Pattern:
//   member id     → 00000000-0000-0000-0000-1{idx,012}
//   owner user id → 00000000-0000-0000-0000-2{idx,012}
function syntheticId(prefix: '1' | '2', idx: number): string {
  const tail = String(idx).padStart(11, '0')
  return `00000000-0000-0000-0000-${prefix}${tail}`
}

const DEMO_LICENSE_PATTERN: LicenseStatus[] = [
  'fully_licensed',
  'pending',
  'fully_licensed',
  'expired',
  'fully_licensed',
  'pending'
]

interface DemoCentreRow extends MyCentre {
  org_id: string
  owner_user_id: string
}

function buildCentre(s: SeedCentre, idx: number): DemoCentreRow {
  const memberId = syntheticId('1', idx)
  const ownerId = syntheticId('2', idx)
  const license = DEMO_LICENSE_PATTERN[idx % DEMO_LICENSE_PATTERN.length]
  const joined = new Date(2025, 6 + (idx % 9), 1 + (idx % 27))
  const expiry = license === 'expired'
    ? new Date(2026, 1, 15)
    : license === 'fully_licensed'
      ? new Date(2027, (idx % 12), 10 + (idx % 18))
      : null
  const totalChildren = s.children
  const a02 = Math.max(2, Math.round(totalChildren * 0.3))
  const a34 = Math.max(2, Math.round(totalChildren * 0.4))
  const a56 = Math.max(0, totalChildren - a02 - a34)

  return {
    id: memberId,
    centre_name: s.name,
    ward: s.ward,
    district: s.district,
    phone: `+25575${String(2000000 + idx * 137).padStart(7, '0')}`,
    email: idx % 3 === 0 ? `${s.name.replace(/\s+/g, '.').toLowerCase()}@uviwada.demo` : null,
    children_count: totalChildren,
    caregiver_count: Math.max(2, Math.round(totalChildren / 8)),
    age_band_0_2: a02,
    age_band_3_4: a34,
    age_band_5_6: a56,
    license_status: license,
    license_number: license === 'not_applied' ? null : `TZ-${String(1000 + idx)}/${license === 'expired' ? '2024' : '2026'}`,
    license_expiry: expiry ? expiry.toISOString().slice(0, 10) : null,
    joined_at: joined.toISOString(),
    latest_quality: s.quality,
    org_id: DAR_ORG_ID,
    owner_user_id: ownerId
  }
}

export const DEMO_CENTRES: DemoCentreRow[] = SEED_CENTRES.map(buildCentre)

// One synthetic owner user per centre, plus the four staff presets.
function buildOwnerUser(centre: DemoCentreRow): DemoUser {
  return {
    id: centre.owner_user_id,
    org_id: DAR_ORG_ID,
    role: 'member',
    full_name: `Owner of ${centre.centre_name}`,
    email: centre.email,
    phone: centre.phone,
    member_id: centre.id,
    ward: centre.ward
  }
}

const STAFF_FALLBACK_USERS: Record<string, DemoUser> = Object.fromEntries(
  SEED_USER_PRESETS.map((p) => [
    p.id,
    {
      id: p.id,
      org_id: DAR_ORG_ID,
      role: p.role as DemoRole,
      full_name: p.label_en,
      email: null,
      phone: null,
      member_id: null,
      ward: p.role === 'assessor' ? 'Kinondoni' : null
    }
  ])
)

const OWNER_FALLBACK_USERS: Record<string, DemoUser> = Object.fromEntries(
  DEMO_CENTRES.map((c) => [c.owner_user_id, buildOwnerUser(c)])
)

export function getDemoUserById(userId: string): DemoUser | null {
  return STAFF_FALLBACK_USERS[userId] ?? OWNER_FALLBACK_USERS[userId] ?? null
}

export function getDemoCentreById(memberId: string): DemoCentreRow | null {
  return DEMO_CENTRES.find((c) => c.id === memberId) ?? null
}

export function getDemoOwnerForMember(memberId: string): DemoUser | null {
  const centre = getDemoCentreById(memberId)
  return centre ? OWNER_FALLBACK_USERS[centre.owner_user_id] : null
}

export interface DemoMemberOption {
  id: string
  centre_name: string
  ward: string
  district: string
}

export function listDemoMemberOptions(orgId: string): DemoMemberOption[] {
  if (orgId !== DAR_ORG_ID) return []
  return DEMO_CENTRES.map((c) => ({
    id: c.id,
    centre_name: c.centre_name,
    ward: c.ward,
    district: c.district
  })).sort((a, b) => {
    if (a.ward !== b.ward) return a.ward.localeCompare(b.ward)
    return a.centre_name.localeCompare(b.centre_name)
  })
}

// Used by the public login page — must list every centre regardless of the
// admin's current tenant selection so a centre owner can always find their
// own daycare. The fallback only knows about the 24 UVIWADA-DAR seed
// centres; the live Supabase path returns all 35 across the three orgs.
export function listAllDemoMemberOptions(): Array<DemoMemberOption & { org_id: string }> {
  return DEMO_CENTRES.map((c) => ({
    id: c.id,
    centre_name: c.centre_name,
    ward: c.ward,
    district: c.district,
    org_id: c.org_id
  })).sort((a, b) => {
    if (a.ward !== b.ward) return a.ward.localeCompare(b.ward)
    return a.centre_name.localeCompare(b.centre_name)
  })
}

// Trainings — three upcoming + three completed-style entries based on SIX_TRAININGS.
function buildDemoTrainings(): AdminTraining[] {
  const now = Date.now()
  return SIX_TRAININGS.map((t, idx) => {
    const dayOffset = (idx - 2) * 14 // first three are past, last three upcoming
    const scheduledAt = new Date(now + dayOffset * 86_400_000)
    return {
      id: syntheticId('1', 100 + idx),
      title_sw: t.title_sw,
      title_en: t.title_en,
      category: t.category,
      scheduled_at: scheduledAt.toISOString(),
      location: ['Kinondoni Hall', 'UVIWADA Office', 'Mbagala Centre', 'Kariakoo Hub', 'Ilala Hall', 'Online'][idx % 6],
      capacity: 25 + idx * 3,
      facilitator: ['UVIWADA Trainer', 'CiC Programme Officer', 'External Consultant'][idx % 3],
      registered_count: idx % 3 === 0 ? 12 : idx % 3 === 1 ? 18 : 8
    }
  })
}

export const DEMO_TRAININGS: AdminTraining[] = buildDemoTrainings()

export function getDemoUpcomingTrainings(): UpcomingTraining[] {
  const nowIso = new Date().toISOString()
  return DEMO_TRAININGS.filter((t) => t.scheduled_at >= nowIso)
    .map((t) => ({
      id: t.id,
      title_sw: t.title_sw,
      title_en: t.title_en,
      category: t.category,
      scheduled_at: t.scheduled_at,
      location: t.location,
      capacity: t.capacity,
      facilitator: t.facilitator,
      registered: false
    }))
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
}

// Announcements — bilingual, dated within the last 30 days.
const DEMO_ANNOUNCEMENTS_BASE: Array<Omit<AdminAnnouncement, 'id' | 'published_at'>> = [
  {
    title_sw: 'Karibu kwenye jukwaa jipya la UVIWADA',
    title_en: 'Welcome to the new UVIWADA platform',
    body_sw: 'Tunafurahi kuzindua mfumo huu wa kidijitali wa UVIWADA. Tafadhali jisajili kwa kuingia kwenye akaunti yako.',
    body_en: 'We are excited to launch the UVIWADA digital platform. Please register by signing into your account.'
  },
  {
    title_sw: 'Mafunzo ya Ulinzi wa Mtoto — Aprili 2026',
    title_en: 'Child Safeguarding Training — April 2026',
    body_sw: 'Mafunzo ya kila mwaka yataanza tarehe 15 Aprili. Wamiliki wa vituo wajisajili haraka.',
    body_en: 'The annual safeguarding refresher starts on 15 April. Centre owners should register early.'
  },
  {
    title_sw: 'Tathmini za ubora — Mei 2026',
    title_en: 'Quality assessments — May 2026',
    body_sw: 'Watathmini wetu watatembelea vituo vyote vya UVIWADA-DAR mwezi Mei. Hakikisha leseni zenu zinaonekana.',
    body_en: 'Our assessors will visit every UVIWADA-DAR centre in May. Please ensure licences are visible on site.'
  }
]

export const DEMO_ANNOUNCEMENTS: AdminAnnouncement[] = DEMO_ANNOUNCEMENTS_BASE.map((a, idx) => ({
  ...a,
  id: syntheticId('1', 200 + idx),
  published_at: new Date(Date.now() - idx * 7 * 86_400_000).toISOString()
}))

export function getDemoPortalAnnouncements(): PortalAnnouncement[] {
  return DEMO_ANNOUNCEMENTS.map((a) => ({
    id: a.id,
    title_sw: a.title_sw,
    title_en: a.title_en,
    body_sw: a.body_sw,
    body_en: a.body_en,
    published_at: a.published_at
  }))
}

// Recommended trainings for amber/red centres — pick a couple from SIX_TRAININGS.
export function getDemoRecommendedTrainings(quality: QualityRating | null): RecommendedTraining[] {
  if (quality !== 'amber' && quality !== 'red') return []
  return [
    {
      id: DEMO_TRAININGS[0].id,
      title_sw: SIX_TRAININGS[0].title_sw,
      title_en: SIX_TRAININGS[0].title_en,
      reason_sw: 'Imependekezwa kwa udhaifu katika eneo la Ulinzi wa Mtoto.',
      reason_en: 'Recommended because of weakness in the Safeguarding dimension.'
    },
    {
      id: DEMO_TRAININGS[3].id,
      title_sw: SIX_TRAININGS[3].title_sw,
      title_en: SIX_TRAININGS[3].title_en,
      reason_sw: 'Imependekezwa kwa udhaifu katika eneo la Afya na Usafi.',
      reason_en: 'Recommended because of weakness in the Health & Hygiene dimension.'
    }
  ]
}

export function buildDemoPortalSnapshot(memberId: string): PortalSnapshot {
  const centre = getDemoCentreById(memberId)
  if (!centre) {
    return { centre: null, upcoming: [], announcements: [], recommended: [], weakDimensions: [] }
  }
  const { org_id: _ignoredOrg, owner_user_id: _ignoredOwner, ...publicCentre } = centre
  return {
    centre: publicCentre,
    upcoming: getDemoUpcomingTrainings(),
    announcements: getDemoPortalAnnouncements(),
    recommended: getDemoRecommendedTrainings(centre.latest_quality),
    weakDimensions: []
  }
}

// Admin tables built from DEMO_CENTRES.
export function listDemoMembersForOrg(orgId: string): AdminMember[] {
  if (orgId !== DAR_ORG_ID) return []
  return DEMO_CENTRES.map((c) => ({
    id: c.id,
    centre_name: c.centre_name,
    ward: c.ward,
    district: c.district,
    phone: c.phone,
    email: c.email,
    children_count: c.children_count,
    caregiver_count: c.caregiver_count,
    license_status: c.license_status as LicenseStatus,
    license_number: c.license_number,
    license_expiry: c.license_expiry,
    latest_quality: c.latest_quality,
    joined_at: c.joined_at
  }))
}

export function buildDemoTenantStats(orgId: string): AdminTenantStats {
  const members = listDemoMembersForOrg(orgId)
  const empty: AdminTenantStats = {
    total_members: 0,
    active_centres: 0,
    pct_green: 0,
    pct_amber: 0,
    pct_red: 0,
    trainings_upcoming: 0,
    trainings_attended: 0,
    expired_licences: 0,
    expiring_30d: 0,
    total_children: 0,
    by_ward: [],
    by_district: [],
    membership_growth: { labels: [], data: [] }
  }
  if (members.length === 0) return empty

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
    totalChildren += m.children_count
    if (m.license_status !== 'expired') active += 1
    else expired += 1
    if (m.license_expiry) {
      const days = Math.ceil((new Date(m.license_expiry).getTime() - today) / 86_400_000)
      if (days >= 0 && days <= 30) expiring30 += 1
    }
    byWard.set(m.ward, (byWard.get(m.ward) ?? 0) + 1)
    byDistrict.set(m.district, (byDistrict.get(m.district) ?? 0) + 1)
  }

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

  const total = members.length
  const upcoming = DEMO_TRAININGS.filter((t) => t.scheduled_at >= new Date().toISOString()).length

  return {
    total_members: total,
    active_centres: active,
    pct_green: Math.round((counts.green / total) * 100),
    pct_amber: Math.round((counts.amber / total) * 100),
    pct_red: Math.round((counts.red / total) * 100),
    trainings_upcoming: upcoming,
    trainings_attended: 18,
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
}
