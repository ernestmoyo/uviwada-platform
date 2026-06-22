// Site-wide access gate (pre-launch privacy). Shared helpers used by both the
// Edge middleware and the Node /api/gate route. Web Crypto works in both runtimes.

export const GATE_COOKIE = 'uviwata_gate'
export const GATE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

// API path prefixes the field/mobile app needs — these authenticate with a
// bearer token, so they must stay reachable WITHOUT the browser gate cookie.
export const DEVICE_API_PREFIXES = [
  '/api/sync',
  '/api/field',
  '/api/curriculum', // covers /api/curriculum and /api/curriculum/lesson-plan
  '/api/assessments/recommendations'
]

/** Paths that bypass the gate entirely: the gate page, its API, and device APIs. */
export function isGateAllowlisted(pathname: string): boolean {
  if (pathname === '/gate' || pathname === '/api/gate') return true
  return DEVICE_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

/** SHA-256 hex of a string via Web Crypto (available in Edge + Node 18+). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
