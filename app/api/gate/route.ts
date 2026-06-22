import { NextResponse } from 'next/server'

import { GATE_COOKIE, GATE_MAX_AGE_SECONDS, sha256Hex } from '@/lib/gate'

// Verify the shared site password and set the gate cookie. The cookie stores the
// SHA-256 of the password (never the password itself); rotating SITE_GATE_PASSWORD
// invalidates all existing cookies.
export async function POST(request: Request) {
  const password = process.env.SITE_GATE_PASSWORD
  if (!password) return NextResponse.json({ ok: true }) // gate disabled

  let body: { password?: unknown }
  try {
    body = (await request.json()) as { password?: unknown }
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const given = typeof body.password === 'string' ? body.password : ''
  // Compare via hashes (uniform length) rather than the raw secret.
  const [givenHash, expected] = await Promise.all([sha256Hex(given), sha256Hex(password)])
  if (givenHash !== expected) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(GATE_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: GATE_MAX_AGE_SECONDS
  })
  return res
}
