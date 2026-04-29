import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, landingRouteForRole, type DemoRole } from '@/lib/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'
import { getDemoCentreById, getDemoUserById } from '@/lib/demo-fallback'

const bodySchema = z.union([
  z.object({ user_id: z.string().uuid() }),
  z.object({ member_id: z.string().uuid() })
])

function setSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  })
}

export async function POST(request: Request) {
  let parsed: { user_id: string } | { member_id: string }
  try {
    parsed = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Demo-mode short-circuit: no Supabase configured, so resolve the session
  // entirely from the static fallback. This is what powers the test
  // environment with no secrets.
  if (!isSupabaseConfigured()) {
    if ('member_id' in parsed) {
      const centre = getDemoCentreById(parsed.member_id)
      if (!centre) return NextResponse.json({ error: 'Centre not found' }, { status: 404 })
      const response = NextResponse.json({ ok: true, redirect: landingRouteForRole('member') })
      setSessionCookie(response, centre.owner_user_id)
      return response
    }
    const user = getDemoUserById(parsed.user_id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const response = NextResponse.json({ ok: true, redirect: landingRouteForRole(user.role) })
    setSessionCookie(response, user.id)
    return response
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  // Daycare-owner sign-in: lazy-provision an owner user if none exists yet.
  // Idempotent — second call for the same centre reuses the linked owner.
  if ('member_id' in parsed) {
    const { data: member, error: memberErr } = await supabase
      .from('members')
      .select('id, org_id, centre_name, owner_user_id')
      .eq('id', parsed.member_id)
      .single()

    if (memberErr || !member) {
      return NextResponse.json({ error: 'Centre not found' }, { status: 404 })
    }

    let ownerUserId = member.owner_user_id as string | null

    if (!ownerUserId) {
      // Schema declares app_users.id as uuid PK with no default, so we
      // generate one server-side. (See supabase/migrations/0001_init.sql.)
      const newId = randomUUID()
      const fullName = `Owner of ${member.centre_name}`
      const { data: created, error: insertErr } = await supabase
        .from('app_users')
        .insert({
          id: newId,
          org_id: member.org_id,
          role: 'member',
          full_name: fullName,
          member_id: member.id
        })
        .select('id')
        .single()

      if (insertErr || !created) {
        console.error('auto-provision insert failed', insertErr)
        return NextResponse.json({ error: 'Could not provision owner' }, { status: 500 })
      }

      ownerUserId = created.id as string
      await supabase.from('members').update({ owner_user_id: ownerUserId }).eq('id', member.id)
    }

    const response = NextResponse.json({ ok: true, redirect: landingRouteForRole('member') })
    setSessionCookie(response, ownerUserId)
    return response
  }

  // Staff preset sign-in: existing flow.
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
  setSessionCookie(response, data.id)
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
