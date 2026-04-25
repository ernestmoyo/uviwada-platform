import 'server-only'

// Demo auth — pre-seeded role switcher. NO password / OTP / SMS round-trip.
// Stores the chosen user's UUID in an httpOnly cookie. RLS still enforces
// row visibility; we just bypass the auth handshake for the pitch.
//
// Production replacement: Supabase phone-OTP. Same cookie name, same shape;
// only the issuance path changes.

import { cookies } from 'next/headers'

import { getSupabaseAdmin } from './supabase/server'
import type { DemoRole } from './auth-presets'

export { SEED_USER_PRESETS, landingRouteForRole, type DemoRole } from './auth-presets'

export interface DemoUser {
  id: string
  org_id: string
  role: DemoRole
  full_name: string
  email: string | null
  phone: string | null
  member_id: string | null
  ward: string | null
}

export const SESSION_COOKIE = 'uviwada_demo_user'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8 // 8 hours

export async function getCurrentUser(): Promise<DemoUser | null> {
  const cookieStore = cookies()
  const userId = cookieStore.get(SESSION_COOKIE)?.value
  if (!userId) return null

  const supabase = getSupabaseAdmin()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('app_users')
    .select('id, org_id, role, full_name, email, phone, member_id, ward')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as DemoUser
}
