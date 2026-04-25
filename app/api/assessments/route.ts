import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'

const indicatorSchema = z.object({
  indicator_code: z.string(),
  dimension: z.enum(['infrastructure', 'staffing', 'curriculum', 'health_hygiene', 'safeguarding', 'nutrition']),
  passed: z.boolean()
})

const bodySchema = z.object({
  member_id: z.string().uuid(),
  rating: z.enum(['green', 'amber', 'red']),
  score_total: z.number().int().min(0).max(100),
  score_max: z.number().int().min(1).max(100),
  notes: z.string().nullable().optional(),
  follow_up_date: z.string().nullable().optional(),
  gps_lat: z.number().nullable().optional(),
  gps_lng: z.number().nullable().optional(),
  photos: z.array(z.string()).default([]),
  indicators: z.array(indicatorSchema),
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

  const { data: assessmentRow, error: aErr } = await supabase
    .from('assessments')
    .insert({
      member_id: payload.member_id,
      assessor_user_id: user.id,
      conducted_at: new Date().toISOString(),
      rating: payload.rating,
      score_total: payload.score_total,
      score_max: payload.score_max,
      notes: payload.notes ?? null,
      follow_up_date: payload.follow_up_date || null,
      photos: payload.photos,
      gps_lat: payload.gps_lat ?? null,
      gps_lng: payload.gps_lng ?? null,
      source: payload.source
    })
    .select('id')
    .single()

  if (aErr || !assessmentRow) {
    return NextResponse.json({ error: 'Failed to save assessment', detail: aErr?.message }, { status: 500 })
  }

  const assessmentId = (assessmentRow as { id: string }).id
  const indicatorRows = payload.indicators.map((ind) => ({
    assessment_id: assessmentId,
    dimension: ind.dimension,
    indicator_code: ind.indicator_code,
    passed: ind.passed
  }))

  const { error: iErr } = await supabase.from('quality_indicator_scores').insert(indicatorRows)
  if (iErr) {
    return NextResponse.json({ error: 'Saved assessment but indicator scores failed', detail: iErr.message }, { status: 500 })
  }

  // The on-insert trigger updates members.latest_quality automatically.
  return NextResponse.json({ ok: true, id: assessmentId, rating: payload.rating, score: payload.score_total })
}
