import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// A DCC (member) requests a future training topic. The secretariat sees these on
// /admin/trainings and can schedule one in response.
const bodySchema = z.object({
  category: z
    .enum(['safeguarding', 'curriculum', 'nutrition', 'health_hygiene', 'staffing', 'infrastructure'])
    .optional(),
  topic: z.string().trim().min(2).max(200),
  note: z.string().trim().max(1000).optional().or(z.literal(''))
})

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'member' || !user.member_id) {
    return NextResponse.json({ error: 'Members only' }, { status: 403 })
  }

  let payload: z.infer<typeof bodySchema>
  try {
    payload = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Please enter a training topic.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  // Tag the request with the member's org so the right secretariat sees it.
  const { data: member } = await supabase.from('members').select('org_id').eq('id', user.member_id).maybeSingle()
  const orgId = (member as { org_id?: string } | null)?.org_id ?? null

  const { error } = await supabase.from('training_requests').insert({
    org_id: orgId,
    member_id: user.member_id,
    category: payload.category ?? null,
    topic: payload.topic,
    note: payload.note || null,
    status: 'open'
  })
  if (error) return NextResponse.json({ error: 'Could not submit request', detail: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
