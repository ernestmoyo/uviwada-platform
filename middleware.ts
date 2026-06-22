import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { GATE_COOKIE, isGateAllowlisted, sha256Hex } from '@/lib/gate'

// Site-wide password gate. Active only when SITE_GATE_PASSWORD is set (fail-open
// otherwise, so deploying never causes a lockout before the var is configured).
// Browser pages without a valid gate cookie are redirected to /gate; session-only
// APIs return 401; the field app's bearer endpoints are allowlisted and pass through.
export async function middleware(req: NextRequest) {
  const password = process.env.SITE_GATE_PASSWORD
  if (!password) return NextResponse.next() // gate disabled until configured

  const { pathname, search } = req.nextUrl
  if (isGateAllowlisted(pathname)) return NextResponse.next()

  const expected = await sha256Hex(password)
  const cookie = req.cookies.get(GATE_COOKIE)?.value
  if (cookie && cookie === expected) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Site access required' }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = '/gate'
  url.search = '?from=' + encodeURIComponent(pathname + search)
  return NextResponse.redirect(url)
}

// Run on everything except Next internals and static files (any path with a dot,
// e.g. /uviwata_logo.png, /tz_regions.geojson). API routes (no dot) are included
// so session APIs get gated; device APIs are allowlisted inside middleware().
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']
}
