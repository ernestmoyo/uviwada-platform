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
    return NextResponse.json({ error: 'Invalid form data', detail: String(err) }, { status: 400 })
  }

  const userId = randomUUID()
  const memberId = randomUUID()

  // Insert member first (FK to user is nullable)
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
    return NextResponse.json({ error: 'Failed to create centre', detail: memberErr.message }, { status: 500 })
  }

  // Create the owner user
  const { error: userErr } = await supabase.from('app_users').insert({
    id: userId,
    org_id: UVIWADA_DAR_ORG_ID,
    role: 'member',
    full_name: payload.owner_full_name,
    email: payload.email || null,
    phone: payload.phone,
    member_id: memberId,
    ward: payload.ward
  })
  if (userErr) {
    // Roll back the member if the user insert failed
    await supabase.from('members').delete().eq('id', memberId)
    return NextResponse.json({ error: 'Failed to create user', detail: userErr.message }, { status: 500 })
  }

  // Issue the demo session cookie so they're logged in immediately
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
