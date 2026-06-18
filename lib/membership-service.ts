import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { dispatchNotification, type NotificationType } from './notify'
import { SECTION_KEYS, type MembershipStatus, type ProfilePublicStatus, type SectionKey, type SectionStatus } from './journey2-constants'

// ============================================================
// Journey 02 — two INDEPENDENT state machines.
// All transitions go through this service: it validates the move is legal,
// writes an audit log row, and dispatches notifications. Controllers must
// NOT update the status columns directly.
// ============================================================

// Re-export shared types/constants so server callers can keep importing from
// the service. Client components import them from ./journey2-constants directly.
export { SECTION_KEYS, SECTION_LABELS } from './journey2-constants'
export type { MembershipStatus, ProfilePublicStatus, SectionStatus, SectionKey } from './journey2-constants'

// Legal membership transitions. Rejected members may be re-opened (re-invite).
const MEMBERSHIP_TRANSITIONS: Record<MembershipStatus, MembershipStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['rejected'],
  rejected: ['approved', 'pending']
}

// Profile statuses are all reversible — no terminal state.
const PROFILE_TRANSITIONS: Record<ProfilePublicStatus, ProfilePublicStatus[]> = {
  draft: ['published', 'hidden', 'pending_update'],
  published: ['hidden', 'pending_update', 'draft'],
  hidden: ['published', 'pending_update', 'draft'],
  pending_update: ['published', 'hidden', 'draft']
}

export interface TransitionResult {
  ok: boolean
  error?: string
  status?: number
}

interface Actor {
  id: string
  role: string
}

const WRITE_ROLES = new Set(['secretariat', 'admin'])

function canWrite(actor: Actor): boolean {
  return WRITE_ROLES.has(actor.role)
}

// ---------- Membership status machine ----------
export async function changeMembershipStatus(
  supabase: SupabaseClient,
  memberId: string,
  toStatus: MembershipStatus,
  actor: Actor,
  note?: string | null
): Promise<TransitionResult> {
  if (!canWrite(actor)) return { ok: false, error: 'Not allowed', status: 403 }

  const { data: member, error } = await supabase
    .from('members')
    .select('id, email, membership_status')
    .eq('id', memberId)
    .single()
  if (error || !member) return { ok: false, error: 'Centre not found', status: 404 }

  const from = ((member as { membership_status?: MembershipStatus }).membership_status ?? 'pending') as MembershipStatus
  if (from === toStatus) return { ok: false, error: `Already ${toStatus}`, status: 409 }
  if (!MEMBERSHIP_TRANSITIONS[from]?.includes(toStatus)) {
    return { ok: false, error: `Illegal transition ${from} → ${toStatus}`, status: 422 }
  }
  if (toStatus === 'rejected' && !note?.trim()) {
    return { ok: false, error: 'A note is required when rejecting a registration', status: 400 }
  }

  const { error: updErr } = await supabase
    .from('members')
    .update({ membership_status: toStatus })
    .eq('id', memberId)
  if (updErr) return { ok: false, error: 'Could not update membership status', status: 500 }

  await supabase.from('membership_status_logs').insert({
    member_id: memberId,
    actor_id: actor.id,
    from_status: from,
    to_status: toStatus,
    note: note?.trim() || null
  })

  if (toStatus === 'approved') await seedSections(supabase, memberId)

  const notifyType: NotificationType | null =
    toStatus === 'approved'
      ? 'membership_approved'
      : toStatus === 'rejected'
        ? 'membership_rejected'
        : toStatus === 'pending'
          ? 'membership_reopened'
          : null
  if (notifyType) {
    await dispatchNotification({
      supabase,
      memberId,
      type: notifyType,
      toEmail: (member as { email?: string | null }).email ?? null,
      note
    })
  }

  return { ok: true }
}

// ---------- Profile public status machine ----------
export async function changeProfileStatus(
  supabase: SupabaseClient,
  memberId: string,
  toStatus: ProfilePublicStatus,
  actor: Actor,
  note?: string | null
): Promise<TransitionResult> {
  if (!canWrite(actor)) return { ok: false, error: 'Not allowed', status: 403 }

  const { data: member, error } = await supabase
    .from('members')
    .select('id, email, membership_status, profile_public_status')
    .eq('id', memberId)
    .single()
  if (error || !member) return { ok: false, error: 'Centre not found', status: 404 }

  // Profile moderation is only available AFTER membership approval.
  const membership = (member as { membership_status?: MembershipStatus }).membership_status ?? 'pending'
  if (membership !== 'approved') {
    return { ok: false, error: 'Profile moderation is only available after the membership is approved', status: 409 }
  }

  const from = ((member as { profile_public_status?: ProfilePublicStatus }).profile_public_status ??
    'draft') as ProfilePublicStatus
  if (from === toStatus) return { ok: false, error: `Already ${toStatus}`, status: 409 }
  if (!PROFILE_TRANSITIONS[from]?.includes(toStatus)) {
    return { ok: false, error: `Illegal transition ${from} → ${toStatus}`, status: 422 }
  }
  if (toStatus === 'pending_update' && !note?.trim()) {
    return { ok: false, error: 'A note is required when requesting an update', status: 400 }
  }

  const { error: updErr } = await supabase
    .from('members')
    .update({ profile_public_status: toStatus })
    .eq('id', memberId)
  if (updErr) return { ok: false, error: 'Could not update profile status', status: 500 }

  await supabase.from('profile_status_logs').insert({
    member_id: memberId,
    actor_id: actor.id,
    from_status: from,
    to_status: toStatus,
    note: note?.trim() || null
  })

  const notifyType: NotificationType | null =
    toStatus === 'published'
      ? 'profile_published'
      : toStatus === 'hidden'
        ? 'profile_hidden'
        : toStatus === 'pending_update'
          ? 'profile_update_requested'
          : null
  if (notifyType) {
    await dispatchNotification({
      supabase,
      memberId,
      type: notifyType,
      toEmail: (member as { email?: string | null }).email ?? null,
      note
    })
  }

  return { ok: true }
}

// ---------- Section-level publish toggle ----------
// Server-side consent enforcement: a section can only be PUBLISHED if the
// member consented to share it. This is the authoritative check — never rely
// on the UI alone.
export async function setSectionStatus(
  supabase: SupabaseClient,
  memberId: string,
  sectionKey: string,
  toStatus: SectionStatus,
  actor: Actor
): Promise<TransitionResult> {
  if (!canWrite(actor)) return { ok: false, error: 'Not allowed', status: 403 }

  const { data: section, error } = await supabase
    .from('profile_sections')
    .select('id, consent_given, public_status')
    .eq('member_id', memberId)
    .eq('section_key', sectionKey)
    .single()
  if (error || !section) return { ok: false, error: 'Section not found', status: 404 }

  if (toStatus === 'published' && !(section as { consent_given?: boolean }).consent_given) {
    return {
      ok: false,
      error: 'This section cannot be published — the member has not consented to share it',
      status: 403
    }
  }

  const { error: updErr } = await supabase
    .from('profile_sections')
    .update({ public_status: toStatus, updated_at: new Date().toISOString() })
    .eq('id', (section as { id: string }).id)
  if (updErr) return { ok: false, error: 'Could not update section', status: 500 }

  return { ok: true }
}

// Seed the four canonical sections from the member record on approval.
// Idempotent — existing sections are left untouched (won't clobber consent
// the member set later). Consent defaults from the member-level public-listing
// consent captured at registration.
async function seedSections(supabase: SupabaseClient, memberId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('profile_sections')
    .select('section_key')
    .eq('member_id', memberId)
  const have = new Set(((existing ?? []) as Array<{ section_key: string }>).map((s) => s.section_key))

  const { data: m } = await supabase
    .from('members')
    .select(
      'phone, email, address, ward, district, children_count, caregiver_count, age_band_0_2, age_band_3_4, age_band_5_6, license_status, license_number, license_expiry, consent_public_listing'
    )
    .eq('id', memberId)
    .single()
  if (!m) return
  const row = m as Record<string, unknown>
  const consent = Boolean(row.consent_public_listing)

  const sectionContent: Record<SectionKey, Record<string, unknown>> = {
    contact: { phone: row.phone, email: row.email, address: row.address },
    location: { ward: row.ward, district: row.district },
    capacity: {
      children_count: row.children_count,
      caregiver_count: row.caregiver_count,
      age_band_0_2: row.age_band_0_2,
      age_band_3_4: row.age_band_3_4,
      age_band_5_6: row.age_band_5_6
    },
    licensing: {
      license_status: row.license_status,
      license_number: row.license_number,
      license_expiry: row.license_expiry
    }
  }

  const toInsert = SECTION_KEYS.filter((k) => !have.has(k)).map((k) => ({
    member_id: memberId,
    section_key: k,
    content: sectionContent[k],
    consent_given: consent,
    public_status: 'hidden' as SectionStatus
  }))
  if (toInsert.length > 0) {
    await supabase.from('profile_sections').insert(toInsert)
  }
}
