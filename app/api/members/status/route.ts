import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

// Secretariat approval of a pending centre registration (Issue 3).
// Only write-capable staff (secretariat / admin) may change a centre's
// membership_status. cic_staff is read-only and members cannot reach here.
const bodySchema = z.object({
  member_id: z.string().uuid(),
  status: z.enum(['approved', 'rejected', 'pending'])
})

const WRITE_ROLES = new Set(['secretariat', 'admin'])

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (!WRITE_ROLES.has(user.role)) {
    return NextResponse.json({ error: 'You are not allowed to approve registrations' }, { status: 403 })
  }

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const { error } = await supabase
    .from('members')
    .update({ membership_status: parsed.data.status })
    .eq('id', parsed.data.member_id)

  if (error) {
    console.error('members/status: failed', error)
    return NextResponse.json({ error: 'Could not update status. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: parsed.data.status })
}
