import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getCurrentTenantId } from '@/lib/tenant'

const createSchema = z.object({
  title_sw: z.string().min(2),
  title_en: z.string().min(2),
  category: z.enum(['safeguarding', 'curriculum', 'nutrition', 'health_hygiene', 'staffing', 'infrastructure']),
  scheduled_at: z.string().min(8),
  location: z.string().min(2),
  capacity: z.coerce.number().int().min(1).max(500),
  facilitator: z.string().optional().or(z.literal(''))
})

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['secretariat', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: z.infer<typeof createSchema>
  try {
    payload = createSchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json({ error: 'Invalid form data', detail: String(err) }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const orgId = getCurrentTenantId()
  const { data, error } = await supabase
    .from('trainings')
    .insert({
      org_id: orgId,
      title_sw: payload.title_sw,
      title_en: payload.title_en,
      category: payload.category,
      scheduled_at: new Date(payload.scheduled_at).toISOString(),
      location: payload.location,
      capacity: payload.capacity,
      facilitator: payload.facilitator || null
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Failed', detail: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: (data as { id: string }).id })
}
