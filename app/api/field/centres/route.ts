import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase/server'

/**
 * Field-app centres feed.
 *
 * Returns the platform's members as the field app's "centre" shape, so the app
 * captures assessments against REAL member UUIDs (which /api/sync requires to
 * link rubric_assessments.member_id). Token-authenticated (FIELD_SYNC_TOKEN),
 * read-only, CORS-open — same device credential as /api/sync.
 */

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type'
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

const TIER_LABEL: Record<string, string> = { green: 4, amber: 3, red: 2 } as unknown as Record<string, string>

export async function GET(request: Request) {
  const token = process.env.FIELD_SYNC_TOKEN
  if (!token) return json({ error: 'Not configured (FIELD_SYNC_TOKEN unset)' }, 503)
  const presented = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (presented !== token) return json({ error: 'Unauthorized' }, 401)

  const supabase = getSupabaseAdmin()
  if (!supabase) return json({ error: 'Supabase not configured' }, 503)

  const { data, error } = await supabase
    .from('members')
    .select('id, centre_name, ward, district, children_count, latest_quality, phone')
    .order('centre_name', { ascending: true })

  if (error) return json({ error: 'Failed to load centres', detail: error.message }, 500)

  const centres = (data || []).map((m: Record<string, unknown>) => ({
    id: m.id, // real member UUID — what the app sends back as centreId
    name: m.centre_name,
    ward: m.ward || m.district || null,
    children: m.children_count ?? null,
    tier: (TIER_LABEL as Record<string, unknown>)[String(m.latest_quality)] ?? null,
    phone: m.phone ?? null
  }))

  return json({ configVersion: process.env.RUBRIC_VERSION ?? null, centres }, 200)
}
