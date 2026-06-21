// Server-side certificate logic for the payment → certificate journey (Issue 12).
// Backed by the `certificates` table (migration 0006). The localStorage demo
// (lib/membership.ts) is superseded by this for the real flow.
import { getSupabaseAdmin } from '@/lib/supabase/server'

type SB = NonNullable<ReturnType<typeof getSupabaseAdmin>>

export interface CertRow {
  id: string
  member_id: string
  status: 'requested' | 'issued' | 'revoked'
  cert_ref: string | null
  period_label: string | null
  period_start: string | null
  period_end: string | null
  requested_at: string
  approved_by: string | null
  approved_at: string | null
}

export function currentPeriod() {
  const year = new Date().getFullYear()
  return { label: `Annual membership ${year}`, start: `${year}-01-01`, end: `${year}-12-31`, year }
}

function randomDigits(n: number): string {
  let s = ''
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10)
  return s
}

// Raise a 'requested' certificate for the member's current period if none is
// already requested or issued. Called when a payment is verified.
export async function ensureCertificateRequest(supabase: SB, memberId: string): Promise<void> {
  const { label, start, end } = currentPeriod()
  const { data: existing } = await supabase
    .from('certificates')
    .select('id')
    .eq('member_id', memberId)
    .eq('period_label', label)
    .in('status', ['requested', 'issued'])
    .maybeSingle()
  if (existing) return
  await supabase
    .from('certificates')
    .insert({ member_id: memberId, status: 'requested', period_label: label, period_start: start, period_end: end })
}

export async function issueCertificate(supabase: SB, id: string, approverId: string): Promise<CertRow | null> {
  const { data: cert } = await supabase.from('certificates').select('*').eq('id', id).maybeSingle()
  if (!cert) return null // genuinely not found — caller treats as 404
  const c = cert as CertRow
  if (c.status === 'issued') return c
  const year = (c.period_start ?? new Date().toISOString()).slice(0, 4)

  // Try to issue; if the existing/first ref collides with UNIQUE(cert_ref),
  // retry once with a freshly generated reference. Any other DB error throws so
  // callers (and the secretariat UI) see the failure instead of a silent no-op.
  for (let attempt = 0; attempt < 2; attempt++) {
    const ref = (attempt === 0 && c.cert_ref) ? c.cert_ref : `UVW-CERT-${year}-${randomDigits(5)}`
    const { data: updated, error } = await supabase
      .from('certificates')
      .update({ status: 'issued', cert_ref: ref, approved_by: approverId, approved_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (!error) {
      if (!updated) throw new Error('Certificate update returned no row')
      return updated as CertRow
    }
    // 23505 = unique_violation on cert_ref — loop to retry with a new ref.
    if (error.code !== '23505' || attempt === 1) {
      throw new Error(`Could not issue certificate: ${error.message}`)
    }
  }
  return null
}

export async function getCertificateForMember(supabase: SB, memberId: string): Promise<CertRow | null> {
  const { data } = await supabase
    .from('certificates')
    .select('*')
    .eq('member_id', memberId)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as CertRow) ?? null
}

// Raise a certificate request (if needed) AND issue it in one step. Used when a
// payment is verified, so a verified payment always yields an issued certificate.
export async function requestAndIssueCertificate(
  supabase: SB,
  memberId: string,
  approverId: string
): Promise<CertRow | null> {
  await ensureCertificateRequest(supabase, memberId)
  const cert = await getCertificateForMember(supabase, memberId)
  if (!cert) return null
  return issueCertificate(supabase, cert.id, approverId)
}
