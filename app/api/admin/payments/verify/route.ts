import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requestAndIssueCertificate } from '@/lib/certificates'

const ADMIN_ROLES = new Set(['secretariat', 'admin'])
const bodySchema = z.object({ payment_id: z.string().uuid() })

// Secretariat verifies a member-submitted (pending) payment. Verifying it
// auto-issues the membership certificate.
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const { data: pay } = await supabase
    .from('member_payments')
    .select('id, member_id, status')
    .eq('id', parsed.data.payment_id)
    .maybeSingle()
  if (!pay) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  const p = pay as { id: string; member_id: string; status: string }

  if (p.status !== 'verified') {
    const { error } = await supabase
      .from('member_payments')
      .update({ status: 'verified', verified_at: new Date().toISOString(), verified_by: user.id })
      .eq('id', p.id)
    if (error) {
      console.error('verify: update failed', error)
      return NextResponse.json({ error: 'Could not verify payment' }, { status: 500 })
    }
  }

  let certRef: string | null = null
  try {
    const cert = await requestAndIssueCertificate(supabase, p.member_id, user.id)
    certRef = cert?.cert_ref ?? null
  } catch (e) {
    console.error('verify: certificate issue failed (non-fatal)', e)
  }
  return NextResponse.json({ ok: true, cert_ref: certRef })
}
