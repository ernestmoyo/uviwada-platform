import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { landingRouteForRole } from '@/lib/auth-presets'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ signedIn: false })
  }
  return NextResponse.json({
    signedIn: true,
    role: user.role,
    landingPath: landingRouteForRole(user.role)
  })
}
