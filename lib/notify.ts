import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

// Notification dispatch. Email delivery requires an external provider that is
// not yet configured for this deployment, so for now we record the intent
// (server log + best-effort row) and return. Wire a provider here later
// (e.g. Resend / SES) — the call sites already pass everything needed.
//
// This mirrors the spec's pragmatism (manual payments now, automated later):
// the notification is dispatched through ONE function so adding real email
// delivery is a single change, not a hunt across controllers.

export type NotificationType =
  | 'membership_approved'
  | 'membership_rejected'
  | 'membership_reopened'
  | 'profile_published'
  | 'profile_hidden'
  | 'profile_update_requested'

interface DispatchArgs {
  supabase: SupabaseClient
  memberId: string
  type: NotificationType
  toEmail: string | null
  note?: string | null
}

const MESSAGES: Record<NotificationType, { subject: string; body: (note?: string | null) => string }> = {
  membership_approved: {
    subject: 'Your UVIWATA registration has been approved',
    body: () => 'Your centre has been approved by the UVIWATA secretariat. You can now sign in to your portal.'
  },
  membership_rejected: {
    subject: 'Your UVIWATA registration was not approved',
    body: (note) => `Your registration was not approved.${note ? ` Reason: ${note}` : ''} Please contact the secretariat.`
  },
  membership_reopened: {
    subject: 'Your UVIWATA registration has been re-opened',
    body: () => 'Your registration has been re-opened. The secretariat will review it again.'
  },
  profile_published: {
    subject: 'Your UVIWATA public profile is now live',
    body: () => 'Your centre profile is now visible in the public UVIWATA directory.'
  },
  profile_hidden: {
    subject: 'Your UVIWATA public profile has been hidden',
    body: () => 'Your centre profile has been hidden from the public directory.'
  },
  profile_update_requested: {
    subject: 'Action needed: update your UVIWATA profile',
    body: (note) => `The secretariat has requested an update to your profile.${note ? ` Note: ${note}` : ''}`
  }
}

export async function dispatchNotification(args: DispatchArgs): Promise<void> {
  const { supabase, memberId, type, toEmail, note } = args
  const msg = MESSAGES[type]
  // eslint-disable-next-line no-console
  console.info(
    `[notify] ${type} -> member=${memberId} email=${toEmail ?? 'none'} subject="${msg.subject}" body="${msg.body(note)}"`
  )

  // Best-effort persistence so notifications are not lost before an email
  // provider exists. The table is optional — if it isn't present this no-ops.
  try {
    await supabase.from('member_notifications').insert({
      member_id: memberId,
      type,
      to_email: toEmail,
      subject: msg.subject,
      body: msg.body(note)
    })
  } catch {
    // table not provisioned — console log above is the durable record for now
  }
}
