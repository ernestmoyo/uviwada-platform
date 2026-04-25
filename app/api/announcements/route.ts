import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getCurrentTenantId } from '@/lib/tenant'

const bodySchema = z.object({
  title_sw: z.string().min(2),
  title_en: z.string().min(2),
  body_sw: z.string().min(2),
  body_en: z.string().min(2)
})

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['secretariat', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: z.infer<typeof bodySchema>
  try {
    payload = bodySchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json({ error: 'Invalid body', detail: String(err) }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const orgId = getCurrentTenantId()
  const { error } = await supabase.from('announcements').insert({
    org_id: orgId,
    author_user_id: user.id,
    title_sw: payload.title_sw,
    title_en: payload.title_en,
    body_sw: payload.body_sw,
    body_en: payload.body_en,
    published_at: new Date().toISOString()
  })
  if (error) return NextResponse.json({ error: 'Failed', detail: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
