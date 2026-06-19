import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'
import { requestAndIssueCertificate } from '@/lib/certificates'

// Membership payments (manual; automated gateway integration deferred).
//   * A MEMBER submits their own payment → stored as 'pending' for the
//     secretariat to physically verify. No certificate is raised yet.
//   * The SECRETARIAT/ADMIN records a payment they have already verified →
//     stored as 'verified', which auto-issues the membership certificate.
const bodySchema = z.object({
  member_id: z.string().uuid().optional(), // staff supply this; for a member it's their own
  amount: z.coerce.number().positive().max(1_000_000_000),
  currency: z.string().min(2).max(8).default('TZS'),
  payment_date: z.string().min(8).optional(), // YYYY-MM-DD; defaults to today
  reference_number: z.string().min(1).max(120),
  method: z.enum(['bank_transfer', 'mobile_money', 'cash', 'cheque', 'other']),
  note: z.string().max(2000).optional()
})

const WRITE_ROLES = new Set(['secretariat', 'admin'])

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const isStaff = WRITE_ROLES.has(user.role)
  const isMember = user.role === 'member'
  if (!isStaff && !isMember) {
    return NextResponse.json({ error: 'You are not allowed to record payments' }, { status: 403 })
  }

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => String(i.path[0] ?? ''))
    return NextResponse.json({ error: 'Please fix: ' + fields.join(', '), fields }, { status: 400 })
  }
  const p = parsed.data

  // A member can only pay for their own centre; staff pay for the chosen member.
  const targetMemberId = isStaff ? p.member_id : user.member_id
  if (!targetMemberId) {
    return NextResponse.json({ error: isStaff ? 'member_id is required' : 'No member profile linked' }, { status: 400 })
  }

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true })
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const today = new Date().toISOString().slice(0, 10)
  const verified = isStaff // staff record an already-verified payment; members submit a pending one
  const { error } = await supabase.from('member_payments').insert({
    member_id: targetMemberId,
    amount: p.amount,
    currency: p.currency,
    payment_date: p.payment_date || today,
    reference_number: p.reference_number,
    method: p.method,
    recorded_by: user.id,
    note: p.note || null,
    status: verified ? 'verified' : 'pending',
    verified_at: verified ? new Date().toISOString() : null,
    verified_by: verified ? user.id : null
  })
  if (error) {
    console.error('payments: insert failed', error)
    return NextResponse.json({ error: 'Could not record payment. Please try again.' }, { status: 500 })
  }

  // A verified payment auto-issues the membership certificate. A pending
  // (member-submitted) payment does not — it waits for secretariat verification.
  if (verified) {
    try {
      await requestAndIssueCertificate(supabase, targetMemberId, user.id)
    } catch (e) {
      console.error('payments: certificate issue failed (non-fatal)', e)
    }
  }
  return NextResponse.json({ ok: true, status: verified ? 'verified' : 'pending' })
}

// The signed-in member's latest payment (so the portal can show its status).
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!user.member_id) return NextResponse.json({ payment: null })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const { data } = await supabase
    .from('member_payments')
    .select('amount, currency, payment_date, reference_number, method, status, verified_at')
    .eq('member_id', user.member_id)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return NextResponse.json({ payment: data ?? null })
}
