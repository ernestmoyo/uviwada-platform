import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// Secretariat/admin sets a training's lifecycle status:
//   published → open for registration
//   confirmed → minimum met, the training is going ahead
//   cancelled → not running
const bodySchema = z.object({
  training_id: z.string().uuid(),
  status: z.enum(['published', 'confirmed', 'cancelled'])
})

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['secretariat', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: z.infer<typeof bodySchema>
  try {
    payload = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const { error } = await supabase
    .from('trainings')
    .update({ status: payload.status })
    .eq('id', payload.training_id)
  if (error) return NextResponse.json({ error: 'Failed to update status', detail: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, status: payload.status })
}
