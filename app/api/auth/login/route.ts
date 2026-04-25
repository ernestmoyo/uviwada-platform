import { NextResponse } from 'next/server'
import { z } from 'zod'

import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, landingRouteForRole, type DemoRole } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'

const bodySchema = z.object({
  user_id: z.string().uuid()
})

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  let parsed: { user_id: string }
  try {
    parsed = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('app_users')
    .select('id, role')
    .eq('id', parsed.user_id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const role = data.role as DemoRole
  const response = NextResponse.json({ ok: true, redirect: landingRouteForRole(role) })
  response.cookies.set(SESSION_COOKIE, data.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
