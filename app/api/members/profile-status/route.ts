import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'
import { changeProfileStatus } from '@/lib/membership-service'

// Overall PUBLIC PROFILE status (state machine 2) — Publish / Hide / Request
// Update. Independent of membership status and of per-section toggles.
const bodySchema = z.object({
  member_id: z.string().uuid(),
  status: z.enum(['draft', 'published', 'hidden', 'pending_update']),
  note: z.string().max(2000).optional()
})

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, demo: true })
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const result = await changeProfileStatus(
    supabase,
    parsed.data.member_id,
    parsed.data.status,
    { id: user.id, role: user.role },
    parsed.data.note
  )
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status ?? 400 })
  return NextResponse.json({ ok: true, status: parsed.data.status })
}
