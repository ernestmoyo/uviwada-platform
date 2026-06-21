import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { authorizeRequest, listCurriculum, CORS_HEADERS } from '@/lib/curriculum'

// GET /api/curriculum?ageBand=2-3&subject=... → bilingual curriculum cards.
// Auth: browser cookie session OR field-app device bearer token. CORS for phone.

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(request: Request) {
  const auth = await authorizeRequest(request)
  if (!auth.ok) return json({ error: 'Unauthorized' }, 401)

  const supabase = getSupabaseAdmin()
  if (!supabase) return json({ error: 'Supabase not configured' }, 503)

  const url = new URL(request.url)
  const ageBand = url.searchParams.get('ageBand') || undefined
  const subject = url.searchParams.get('subject') || undefined

  try {
    const cards = await listCurriculum(supabase, { ageBand, subject })
    return json({ cards, configVersion: process.env.RUBRIC_VERSION ?? null })
  } catch (err) {
    return json({ error: 'Failed to load curriculum', detail: String((err as Error)?.message || err) }, 500)
  }
}
