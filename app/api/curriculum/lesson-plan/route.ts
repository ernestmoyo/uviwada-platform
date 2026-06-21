import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getAnthropic, ANTHROPIC_MODEL } from '@/lib/anthropic'
import {
  authorizeRequest, listCurriculum, rankCardsByTheme, saveLessonPlan,
  lessonPlanSystem, lessonPlanUserPrompt, lessonPlanToMarkdown, LESSON_PLAN_SCHEMA,
  CORS_HEADERS, type LessonPlanStructured
} from '@/lib/curriculum'

// POST /api/curriculum/lesson-plan
// body: { ageBand, theme, lang ('sw'|'en'), centreId? }
// Selects relevant curriculum cards, asks Claude for a structured bilingual
// lesson plan, persists it, and returns { id, plan, markdown }.

const bodySchema = z.object({
  ageBand: z.string().min(1),
  theme: z.string().min(2).max(400),
  lang: z.enum(['sw', 'en']).default('sw'),
  centreId: z.string().uuid().optional()
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

  // member_id: explicit centreId (field app) or the logged-in member's centre.
  const memberId = payload.centreId || auth.user?.member_id || null

  try {
    const all = await listCurriculum(supabase, { ageBand: payload.ageBand })
    const cards = rankCardsByTheme(all, payload.theme, 6)

    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 4000,
      system: lessonPlanSystem(payload.lang),
      messages: [{ role: 'user', content: lessonPlanUserPrompt(cards, payload) }],
      output_config: { format: { type: 'json_schema', schema: LESSON_PLAN_SCHEMA } }
    })

    const text = message.content.find((b) => b.type === 'text')
    if (!text || text.type !== 'text') return json({ error: 'No plan returned' }, 502)
    const plan = JSON.parse(text.text) as LessonPlanStructured
    const markdown = lessonPlanToMarkdown(plan, payload.lang)

    const id = await saveLessonPlan(supabase, {
      member_id: memberId,
      created_by: auth.user?.id ?? null,
      age_band: payload.ageBand,
      theme: payload.theme,
      lang: payload.lang,
      title: plan.title,
      content: markdown,
      structured: plan,
      source: auth.via === 'bearer' ? 'apk_synced' : 'web',
      status: 'ready',
      raw: { model: ANTHROPIC_MODEL, card_ids: cards.map((c) => c.id), usage: message.usage }
    })

    return json({ id, plan, markdown })
  } catch (err) {
    return json({ error: 'Failed to generate lesson plan', detail: String((err as Error)?.message || err) }, 500)
  }
}
