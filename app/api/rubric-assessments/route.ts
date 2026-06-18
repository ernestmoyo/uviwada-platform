import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import {
  CAPACITY_COMPETENCIES,
  INFRA_SUBDOMAINS,
  meanLevel,
  levelToScore,
  tierForScore
} from '@/lib/rubric'

const levelMap = z.record(z.string(), z.number().min(1).max(4).nullable())

const bodySchema = z.object({
  member_id: z.string().uuid(),
  assessment_type: z.string().default('Baseline assessment'),
  capacity: levelMap, // { cap01: 1..4 | null, ... }
  infra: levelMap, // { location: 1..4 | null, ... }
  gps_lat: z.number().nullable().optional(),
  gps_lng: z.number().nullable().optional(),
  comments: z.string().nullable().optional(),
  photo_urls: z.array(z.string()).optional(),
  source: z.enum(['web', 'apk_synced']).default('web')
})

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['assessor', 'secretariat', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: z.infer<typeof bodySchema>
  try {
    payload = bodySchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json({ error: 'Invalid body', detail: String(err) }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  // server-authoritative scoring
  const capLevels = CAPACITY_COMPETENCIES.map((c) => payload.capacity[c.key] ?? null)
  const infraLevels = INFRA_SUBDOMAINS.map((c) => payload.infra[c.key] ?? null)
  const capMean = meanLevel(capLevels)
  const infraMean = meanLevel(infraLevels)
  const capScore = capMean == null ? null : levelToScore(capMean)
  const infraScore = infraMean == null ? null : levelToScore(infraMean)
  const tierDef = infraScore == null ? null : tierForScore(infraScore)

  const { data: row, error: aErr } = await supabase
    .from('rubric_assessments')
    .insert({
      member_id: payload.member_id,
      assessor_user_id: user.id,
      assessment_type: payload.assessment_type,
      assessed_on: new Date().toISOString().slice(0, 10),
      gps_lat: payload.gps_lat ?? null,
      gps_lng: payload.gps_lng ?? null,
      capacity_result: capMean,
      capacity_score: capScore,
      infra_result: infraMean,
      infra_score: infraScore,
      infra_tier: tierDef?.label ?? null,
      formalization_pathway: tierDef?.pathway ?? null,
      assessor_comments: payload.comments ?? null,
      source: payload.source,
      raw: { capacity: payload.capacity, infra: payload.infra, entered_by: user.id, photo_urls: payload.photo_urls ?? [] }
    })
    .select('id')
    .single()

  if (aErr || !row) {
    return NextResponse.json({ error: 'Failed to save assessment', detail: aErr?.message }, { status: 500 })
  }
  const assessmentId = (row as { id: string }).id

  const domainRows = [
    ...CAPACITY_COMPETENCIES.map((c) => ({
      assessment_id: assessmentId,
      kind: 'capacity',
      domain_key: c.key,
      domain_label: c.en,
      level: payload.capacity[c.key] ?? null
    })),
    ...INFRA_SUBDOMAINS.map((c) => ({
      assessment_id: assessmentId,
      kind: 'infra',
      domain_key: c.key,
      domain_label: c.en,
      level: payload.infra[c.key] ?? null
    }))
  ]
  const { error: dErr } = await supabase.from('rubric_domain_scores').insert(domainRows)
  if (dErr) {
    return NextResponse.json({ error: 'Saved assessment but domain scores failed', detail: dErr.message }, { status: 500 })
  }

  // trigger updates members.latest_quality from the tier automatically.
  return NextResponse.json({
    ok: true,
    id: assessmentId,
    tier: tierDef?.label ?? 'pending',
    infra_score: infraScore,
    capacity_score: capScore
  })
}
