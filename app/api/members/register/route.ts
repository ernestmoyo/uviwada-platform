import { randomUUID } from 'crypto'

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'

const registrationSchema = z.object({
  centre_name: z.string().min(2),
  owner_full_name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal('')),
  ward: z.string().min(2),
  district: z.string().min(2),
  address: z.string().optional().or(z.literal('')),
  year_founded: z.coerce.number().int().min(1980).max(2100).optional(),
  children_count: z.coerce.number().int().min(0).max(500),
  caregiver_count: z.coerce.number().int().min(0).max(100),
  age_band_0_2: z.coerce.number().int().min(0).default(0),
  age_band_3_4: z.coerce.number().int().min(0).default(0),
  age_band_5_6: z.coerce.number().int().min(0).default(0),
  license_status: z.enum(['fully_licensed', 'pending', 'not_applied']),
  license_number: z.string().optional().or(z.literal('')),
  license_issue_date: z.string().optional().or(z.literal('')),
  license_expiry: z.string().optional().or(z.literal('')),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional()
})

const UVIWADA_DAR_ORG_ID = '00000000-0000-0000-0000-000000000011'

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  let payload: z.infer<typeof registrationSchema>
  try {
    payload = registrationSchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'Some required fields are missing or invalid. Please check the form and try again.' },
      { status: 400 }
    )
  }

  const userId = randomUUID()
  const memberId = randomUUID()

  // Step 1: Insert app_user FIRST with member_id = null. Required because
  //   members.owner_user_id  → app_users.id  (FK)
  //   app_users.member_id    → members.id    (FK, nullable)
  // We start by creating only the side that has no incoming FK requirement,
  // then insert the member, then back-fill app_users.member_id.
  const { error: userErr } = await supabase.from('app_users').insert({
    id: userId,
    org_id: UVIWADA_DAR_ORG_ID,
    role: 'member',
    full_name: payload.owner_full_name,
    email: payload.email || null,
    phone: payload.phone,
    member_id: null,
    ward: payload.ward
  })
  if (userErr) {
    console.error('register: failed to create app_user', userErr)
    return NextResponse.json(
      { error: 'Could not create your account. Please try again or contact UVIWADA support.' },
      { status: 500 }
    )
  }

  // Step 2: Insert the member, now safely referencing the user.
  const { error: memberErr } = await supabase.from('members').insert({
    id: memberId,
    org_id: UVIWADA_DAR_ORG_ID,
    centre_name: payload.centre_name,
    owner_user_id: userId,
    ward: payload.ward,
    district: payload.district,
    address: payload.address || null,
    lat: payload.lat ?? null,
    lng: payload.lng ?? null,
    phone: payload.phone,
    email: payload.email || null,
    year_founded: payload.year_founded ?? null,
    children_count: payload.children_count,
    caregiver_count: payload.caregiver_count,
    age_band_0_2: payload.age_band_0_2,
    age_band_3_4: payload.age_band_3_4,
    age_band_5_6: payload.age_band_5_6,
    license_status: payload.license_status,
    license_number: payload.license_number || null,
    license_issue_date: payload.license_issue_date || null,
    license_expiry: payload.license_expiry || null,
    latest_quality: null
  })
  if (memberErr) {
    // Roll back the user since the member insert failed
    await supabase.from('app_users').delete().eq('id', userId)
    console.error('register: failed to create member', memberErr)
    return NextResponse.json(
      { error: 'Could not create your centre. Please try again or contact UVIWADA support.' },
      { status: 500 }
    )
  }

  // Step 3: Back-fill the app_user's member_id so /portal can resolve their centre.
  const { error: linkErr } = await supabase
    .from('app_users')
    .update({ member_id: memberId })
    .eq('id', userId)
  if (linkErr) {
    // Both rows exist; the link can be repaired by an admin. Log and continue.
    console.error('register: failed to back-link app_user.member_id', linkErr)
  }

  // Step 4: Issue the demo session cookie so they're logged in immediately.
  const response = NextResponse.json({
    ok: true,
    member_id: memberId,
    user_id: userId,
    redirect: '/portal'
  })
  response.cookies.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  })
  return response
}
