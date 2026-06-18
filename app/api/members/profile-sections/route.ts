import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'
import { setSectionStatus } from '@/lib/membership-service'

// Per-section publish toggle. The service enforces consent server-side: a
// non-consented section can never be published, regardless of what the UI sends.
const bodySchema = z.object({
  member_id: z.string().uuid(),
  section_key: z.string().min(1).max(64),
  status: z.enum(['published', 'hidden'])
})

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true })
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const result = await setSectionStatus(
    supabase,
    parsed.data.member_id,
    parsed.data.section_key,
    parsed.data.status,
    { id: user.id, role: user.role }
  )
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status ?? 400 })
  return NextResponse.json({ ok: true })
}
