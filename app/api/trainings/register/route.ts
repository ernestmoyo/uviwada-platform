import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'

const bodySchema = z.object({
  training_id: z.string().uuid()
})

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'member' || !user.member_id) {
    return NextResponse.json({ error: 'Members only' }, { status: 403 })
  }

  let parsed: { training_id: string }
  try {
    parsed = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const { error } = await supabase.from('training_registrations').insert({
    training_id: parsed.training_id,
    member_id: user.member_id,
    status: 'registered'
  })
  if (error) {
    return NextResponse.json({ error: 'Failed to register', detail: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
