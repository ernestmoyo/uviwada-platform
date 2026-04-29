import 'server-only'

// Demo auth — pre-seeded role switcher. NO password / OTP / SMS round-trip.
// Stores the chosen user's UUID in an httpOnly cookie. When Supabase env vars
// are present, RLS still enforces row visibility; when they're absent, the
// session resolves entirely from lib/demo-fallback so the demo can run with
// no secrets.

import { cookies } from 'next/headers'

import { getSupabaseAdmin, isSupabaseConfigured } from './supabase/server'
import { getDemoUserById } from './demo-fallback'
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

  if (!isSupabaseConfigured()) {
    return getDemoUserById(userId)
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return getDemoUserById(userId)

  const { data, error } = await supabase
    .from('app_users')
    .select('id, org_id, role, full_name, email, phone, member_id, ward')
    .eq('id', userId)
    .single()

  if (error || !data) {
    // Cookie may belong to a synthetic demo user even when Supabase is
    // configured — fall back so the picker is forgiving across environments.
    return getDemoUserById(userId)
  }
  return data as DemoUser
}
