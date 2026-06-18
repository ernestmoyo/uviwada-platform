import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

// Manual membership payment recording (automated integration deferred).
// reference_number and method are ALWAYS required — for cash, the secretariat
// assigns an internal reference.
const bodySchema = z.object({
  member_id: z.string().uuid(),
  amount: z.coerce.number().positive().max(1_000_000_000),
  currency: z.string().min(2).max(8).default('TZS'),
  payment_date: z.string().min(8), // YYYY-MM-DD
  reference_number: z.string().min(1).max(120),
  method: z.enum(['bank_transfer', 'mobile_money', 'cash', 'cheque', 'other']),
  note: z.string().max(2000).optional()
})

const WRITE_ROLES = new Set(['secretariat', 'admin'])

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!WRITE_ROLES.has(user.role)) {
    return NextResponse.json({ error: 'You are not allowed to record payments' }, { status: 403 })
  }

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => String(i.path[0] ?? ''))
    return NextResponse.json({ error: 'Please fix: ' + fields.join(', '), fields }, { status: 400 })
  }

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true })
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const p = parsed.data
  const { error } = await supabase.from('member_payments').insert({
    member_id: p.member_id,
    amount: p.amount,
    currency: p.currency,
    payment_date: p.payment_date,
    reference_number: p.reference_number,
    method: p.method,
    recorded_by: user.id,
    note: p.note || null
  })
  if (error) {
    console.error('payments: insert failed', error)
    return NextResponse.json({ error: 'Could not record payment. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
