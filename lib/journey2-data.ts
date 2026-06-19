import 'server-only'

import { getSupabaseAdmin, isSupabaseConfigured } from './supabase/server'
import { isNationalTenant } from './tenant-presets'
import type { MembershipStatus, ProfilePublicStatus, SectionStatus } from './membership-service'

export interface MemberDetail {
  id: string
  centre_name: string
  owner_user_id: string | null
  ward: string
  district: string
  address: string | null
  phone: string
  email: string | null
  children_count: number
  caregiver_count: number
  license_status: string
  license_number: string | null
  license_expiry: string | null
  joined_at: string
  membership_status: MembershipStatus
  profile_public_status: ProfilePublicStatus
  consent_join: boolean | null
  consent_public_listing: boolean | null
  org_id: string
}

export interface StatusLogEntry {
  id: string
  actor_id: string | null
  actor_name: string | null
  from_status: string | null
  to_status: string
  note: string | null
  created_at: string
}

export interface ProfileSectionRow {
  id: string
  section_key: string
  content: Record<string, unknown> | null
  consent_given: boolean
  public_status: SectionStatus
}

export interface PaymentRow {
  id: string
  member_id: string
  amount: number
  currency: string
  payment_date: string
  reference_number: string
  method: string
  recorded_by: string | null
  note: string | null
  created_at: string
}

export interface QueueMember {
  id: string
  centre_name: string
  email: string | null
  phone: string
  ward: string
  district: string
  joined_at: string
  incomplete: boolean
  missing: string[]
}

// A profile is "incomplete" if any of these member-facing required fields are
// blank. Surfaced as a visual flag in the approval queue.
function completeness(m: { email: string | null; address: string | null; license_number: string | null; license_status: string }): {
  incomplete: boolean
  missing: string[]
} {
  const missing: string[] = []
  if (!m.email) missing.push('email')
  if (!m.address) missing.push('address')
  if (m.license_status !== 'not_applied' && !m.license_number) missing.push('license number')
  return { incomplete: missing.length > 0, missing }
}

export async function fetchMemberDetail(id: string): Promise<MemberDetail | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = getSupabaseAdmin()
  if (!supabase) return null
  const { data } = await supabase
    .from('members')
    .select(
      'id, centre_name, owner_user_id, ward, district, address, phone, email, children_count, caregiver_count, license_status, license_number, license_expiry, joined_at, membership_status, profile_public_status, consent_join, consent_public_listing, org_id'
    )
    .eq('id', id)
    .single()
  if (!data) return null
  const row = data as Partial<MemberDetail>
  return {
    ...(row as MemberDetail),
    membership_status: (row.membership_status ?? 'pending') as MembershipStatus,
    profile_public_status: (row.profile_public_status ?? 'draft') as ProfilePublicStatus
  }
}

async function fetchLogs(table: string, memberId: string): Promise<StatusLogEntry[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  const { data } = await supabase
    .from(table)
    .select('id, actor_id, from_status, to_status, note, created_at')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
  const rows = (data ?? []) as Omit<StatusLogEntry, 'actor_name'>[]
  if (rows.length === 0) return []

  // Resolve actor names in one query.
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean))) as string[]
  const names = new Map<string, string>()
  if (actorIds.length > 0) {
    const { data: users } = await supabase.from('app_users').select('id, full_name').in('id', actorIds)
    ;((users ?? []) as Array<{ id: string; full_name: string }>).forEach((u) => names.set(u.id, u.full_name))
  }
  return rows.map((r) => ({ ...r, actor_name: r.actor_id ? names.get(r.actor_id) ?? null : null }))
}

export function fetchMembershipLogs(memberId: string): Promise<StatusLogEntry[]> {
  if (!isSupabaseConfigured()) return Promise.resolve([])
  return fetchLogs('membership_status_logs', memberId)
}

export function fetchProfileLogs(memberId: string): Promise<StatusLogEntry[]> {
  if (!isSupabaseConfigured()) return Promise.resolve([])
  return fetchLogs('profile_status_logs', memberId)
}

export async function fetchProfileSections(memberId: string): Promise<ProfileSectionRow[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  const { data } = await supabase
    .from('profile_sections')
    .select('id, section_key, content, consent_given, public_status')
    .eq('member_id', memberId)
  return (data ?? []) as ProfileSectionRow[]
}

export async function fetchMemberPayments(memberId: string): Promise<PaymentRow[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  const { data } = await supabase
    .from('member_payments')
    .select('id, member_id, amount, currency, payment_date, reference_number, method, recorded_by, note, created_at')
    .eq('member_id', memberId)
    .order('payment_date', { ascending: false })
  return (data ?? []) as PaymentRow[]
}

export async function fetchPendingQueue(orgId: string): Promise<QueueMember[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  let queueQ = supabase
    .from('members')
    .select('id, centre_name, email, phone, ward, district, address, license_number, license_status, joined_at, membership_status')
  if (!isNationalTenant(orgId)) queueQ = queueQ.eq('org_id', orgId)
  const { data } = await queueQ.eq('membership_status', 'pending').order('joined_at', { ascending: false })
  const rows = (data ?? []) as Array<{
    id: string
    centre_name: string
    email: string | null
    phone: string
    ward: string
    district: string
    address: string | null
    license_number: string | null
    license_status: string
    joined_at: string
  }>
  return rows.map((m) => {
    const c = completeness(m)
    return {
      id: m.id,
      centre_name: m.centre_name,
      email: m.email,
      phone: m.phone,
      ward: m.ward,
      district: m.district,
      joined_at: m.joined_at,
      incomplete: c.incomplete,
      missing: c.missing
    }
  })
}

export async function fetchRecentPayments(orgId: string, limit = 50): Promise<Array<PaymentRow & { centre_name: string }>> {
  if (!isSupabaseConfigured()) return []
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  const { data } = await supabase
    .from('member_payments')
    .select('id, member_id, amount, currency, payment_date, reference_number, method, recorded_by, note, created_at, members(centre_name, org_id)')
    .order('payment_date', { ascending: false })
    .limit(limit)
  type Joined = PaymentRow & { members: { centre_name: string; org_id: string } | { centre_name: string; org_id: string }[] | null }
  const rows = (data ?? []) as unknown as Joined[]
  return rows
    .map((r) => {
      const mem = Array.isArray(r.members) ? r.members[0] : r.members
      return mem ? { row: r, mem } : null
    })
    .filter((x): x is { row: Joined; mem: { centre_name: string; org_id: string } } => !!x)
    .filter((x) => isNationalTenant(orgId) || x.mem.org_id === orgId)
    .map((x) => ({ ...x.row, centre_name: x.mem.centre_name }))
}
