import { NextResponse } from 'next/server'
import { z } from 'zod'

import { TENANT_COOKIE, TENANT_PRESETS } from '@/lib/tenant-presets'

const bodySchema = z.object({
  tenant_id: z.string().uuid()
})

export async function POST(request: Request) {
  let parsed: { tenant_id: string }
  try {
    parsed = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!TENANT_PRESETS.some((t) => t.id === parsed.tenant_id)) {
    return NextResponse.json({ error: 'Unknown tenant' }, { status: 404 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(TENANT_COOKIE, parsed.tenant_id, {
    httpOnly: false, // OK to be readable client-side; just a UI hint
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })
  return response
}
