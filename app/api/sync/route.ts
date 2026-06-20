import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { processSyncBatch, type SupabaseLike, type SyncBatch } from '@/lib/field-sync'

/**
 * Field-app sync endpoint.
 *
 * The UVIWATA Field App (mobile/) POSTs its offline queue here as one batch
 * (Concept Note v2.0 §9). Each item is written into the platform's NATIVE rubric
 * storage (rubric_assessments + rubric_domain_scores, migration 0004) — no lossy
 * mapping. The platform stays authoritative and computes the tier.
 *
 * Auth: a device bearer token (env FIELD_SYNC_TOKEN), separate from the browser
 * cookie session. CORS is open because the request is token-authenticated, not
 * cookie-credentialed. Idempotent via rubric_assessments.submission_uuid.
 */

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '86400'
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: Request) {
  const token = process.env.FIELD_SYNC_TOKEN
  if (!token) return json({ error: 'Sync endpoint not configured (FIELD_SYNC_TOKEN unset)' }, 503)

  const presented = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (presented !== token) return json({ error: 'Unauthorized' }, 401)

  let batch: SyncBatch
  try {
    batch = (await request.json()) as SyncBatch
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  if (!batch || !Array.isArray(batch.items)) {
    return json({ error: 'Body must be { configVersion, items: [...] }' }, 400)
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return json({ error: 'Supabase not configured' }, 503)

  const configVersion = batch.configVersion ?? process.env.RUBRIC_VERSION ?? null
  const out = await processSyncBatch(supabase as unknown as SupabaseLike, batch, configVersion)
  return json(out, 200)
}
