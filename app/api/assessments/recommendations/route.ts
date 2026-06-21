import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getAnthropic, ANTHROPIC_MODEL } from '@/lib/anthropic'
import {
  authorizeRequest, latestAssessmentScores, recommendationsSystem, recommendationsPrompt, CORS_HEADERS
} from '@/lib/curriculum'

// POST /api/assessments/recommendations  body: { member_id, lang? }
// AI "areas this centre can improve", grounded in the latest rubric scores.

const bodySchema = z.object({
  member_id: z.string().uuid(),
  lang: z.enum(['sw', 'en']).default('sw')
})

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: Request) {
  const auth = await authorizeRequest(request)
  if (!auth.ok) return json({ error: 'Unauthorized' }, 401)

  let payload: z.infer<typeof bodySchema>
  try {
    payload = bodySchema.parse(await request.json())
  } catch (err) {
    return json({ error: 'Invalid body', detail: String(err) }, 400)
  }

  const anthropic = getAnthropic()
  if (!anthropic) return json({ error: 'AI not configured (ANTHROPIC_API_KEY unset)' }, 503)

  const supabase = getSupabaseAdmin()
  if (!supabase) return json({ error: 'Supabase not configured' }, 503)

  try {
    const scores = await latestAssessmentScores(supabase, payload.member_id)
    if (!scores.length) return json({ recommendations: null, message: 'No assessment yet for this centre.' })

    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 2000,
      system: recommendationsSystem(payload.lang),
      messages: [{ role: 'user', content: recommendationsPrompt(scores, payload.lang) }]
    })
    const text = message.content.find((b) => b.type === 'text')
    const recommendations = text && text.type === 'text' ? text.text : ''
    return json({ recommendations })
  } catch (err) {
    return json({ error: 'Failed to generate recommendations', detail: String((err as Error)?.message || err) }, 500)
  }
}
