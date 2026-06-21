import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { CAPACITY_COMPETENCIES, INFRA_SUBDOMAINS, SCORE_LEVELS } from './rubric'
import { getCurrentUser, type DemoUser } from './auth'

// Auth that accepts EITHER the browser cookie session OR the field-app device
// bearer token (FIELD_SYNC_TOKEN) — so the same endpoints serve web and phone.
export async function authorizeRequest(
  request: Request
): Promise<{ ok: boolean; via: 'cookie' | 'bearer' | null; user: DemoUser | null }> {
  const token = process.env.FIELD_SYNC_TOKEN
  const presented = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (token && presented && presented === token) return { ok: true, via: 'bearer', user: null }
  const user = await getCurrentUser()
  if (user) return { ok: true, via: 'cookie', user }
  return { ok: false, via: null, user: null }
}

// Shared logic for the curriculum / lesson-plan + assessment-recommendation
// features. Pure builders are exported for unit testing; DB helpers take an
// injected supabase admin client.

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type'
}

export interface CurriculumCard {
  id: string
  age_band: string
  subject: string | null
  title_sw: string
  title_en: string | null
  about_sw: string | null
  about_en: string | null
  materials_sw: string | null
  materials_en: string | null
  steps_sw: string | null
  steps_en: string | null
}

export type Lang = 'sw' | 'en'
export const AGE_BANDS = ['2-3', '3-4', '4-5'] as const

// ----------------------------------------------------------------- pure builders
function pick(card: CurriculumCard, field: 'title' | 'about' | 'materials' | 'steps', lang: Lang): string {
  const v = (card[`${field}_${lang}` as keyof CurriculumCard] as string | null) || (card[`${field}_sw` as keyof CurriculumCard] as string | null)
  return (v || '').toString().trim()
}

export function cardsToContext(cards: CurriculumCard[], lang: Lang): string {
  return cards.map((c, i) => {
    const parts = [
      `[Card ${i + 1}] ${pick(c, 'title', lang)}${c.subject ? ` (${c.subject})` : ''}`,
      pick(c, 'about', lang) && `About: ${pick(c, 'about', lang)}`,
      pick(c, 'materials', lang) && `Materials: ${pick(c, 'materials', lang)}`,
      pick(c, 'steps', lang) && `Steps: ${pick(c, 'steps', lang)}`
    ].filter(Boolean)
    return parts.join('\n')
  }).join('\n\n')
}

export function lessonPlanSystem(lang: Lang): string {
  const langName = lang === 'en' ? 'English' : 'Kiswahili'
  return [
    'You are an early-childhood-education curriculum assistant for UVIWATA, a Tanzanian association of daycare centres.',
    'You help a daycare careworker turn the official NECDP curriculum cards into a concrete, usable lesson plan.',
    `Write the ENTIRE lesson plan in ${langName}.`,
    'Ground the plan in the provided curriculum cards — adapt and synthesise them; do not invent unrelated content and do not copy a card verbatim.',
    'The setting is a low-resource daycare for children aged 2–5 in Tanzania: assume simple, locally-available materials.',
    'Be practical, warm, and concrete. Use plain language a careworker can follow step by step.'
  ].join(' ')
}

export function lessonPlanUserPrompt(cards: CurriculumCard[], opts: { ageBand: string; theme: string; lang: Lang }): string {
  return [
    `Age band: ${opts.ageBand} years.`,
    `Theme / topic requested: ${opts.theme}.`,
    '',
    'Relevant curriculum cards:',
    cardsToContext(cards, opts.lang) || '(no specific cards matched — use general NECDP guidance for this age band)',
    '',
    'Produce a single lesson plan for this theme and age band, drawing on the cards above.'
  ].join('\n')
}

// JSON schema for a structured lesson plan (Claude structured outputs).
export const LESSON_PLAN_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    age_band: { type: 'string' },
    theme: { type: 'string' },
    duration_minutes: { type: 'integer' },
    objectives: { type: 'array', items: { type: 'string' } },
    materials: { type: 'array', items: { type: 'string' } },
    introduction: { type: 'string' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, detail: { type: 'string' } },
        required: ['title', 'detail'],
        additionalProperties: false
      }
    },
    assessment: { type: 'string' },
    notes: { type: 'string' }
  },
  required: ['title', 'age_band', 'theme', 'objectives', 'materials', 'introduction', 'steps', 'assessment'],
  additionalProperties: false
} as const

export interface LessonPlanStructured {
  title: string
  age_band: string
  theme: string
  duration_minutes?: number
  objectives: string[]
  materials: string[]
  introduction: string
  steps: Array<{ title: string; detail: string }>
  assessment: string
  notes?: string
}

export function lessonPlanToMarkdown(p: LessonPlanStructured, lang: Lang): string {
  const L = lang === 'en'
    ? { obj: 'Objectives', mat: 'Materials', intro: 'Introduction', steps: 'Steps', assess: 'Assessment', notes: 'Notes', dur: 'Duration', min: 'minutes' }
    : { obj: 'Malengo', mat: 'Vifaa', intro: 'Utangulizi', steps: 'Hatua', assess: 'Tathmini', notes: 'Maelezo', dur: 'Muda', min: 'dakika' }
  const lines: string[] = [`# ${p.title}`, '']
  lines.push(`**${p.age_band} · ${p.theme}**${p.duration_minutes ? ` · ${L.dur} ${p.duration_minutes} ${L.min}` : ''}`, '')
  lines.push(`## ${L.obj}`, ...p.objectives.map((o) => `- ${o}`), '')
  lines.push(`## ${L.mat}`, ...p.materials.map((m) => `- ${m}`), '')
  lines.push(`## ${L.intro}`, p.introduction, '')
  lines.push(`## ${L.steps}`)
  p.steps.forEach((s, i) => lines.push(`${i + 1}. **${s.title}** — ${s.detail}`))
  lines.push('', `## ${L.assess}`, p.assessment)
  if (p.notes) lines.push('', `## ${L.notes}`, p.notes)
  return lines.join('\n')
}

// ----------------------------------------------------------------- recommendations
export interface DomainScoreRow { kind: 'capacity' | 'infra'; domain_key: string; level: number | null }

export function recommendationsSystem(lang: Lang): string {
  const langName = lang === 'en' ? 'English' : 'Kiswahili'
  return [
    'You are a quality-improvement advisor for UVIWATA daycare centres in Tanzania.',
    'Given a centre\'s rubric scores (Level 1 lowest – 4 highest) across careworker-capacity competencies and infrastructure sub-domains,',
    'identify the most important, achievable areas the centre should improve next, and give concrete, low-cost steps for each.',
    `Write in ${langName}. Be specific, supportive, and progressive (focus on the next level up, never pass/fail).`
  ].join(' ')
}

export function recommendationsPrompt(scores: DomainScoreRow[], lang: Lang): string {
  const labelFor = (kind: string, key: string) => {
    const list = kind === 'capacity' ? CAPACITY_COMPETENCIES : INFRA_SUBDOMAINS
    const item = list.find((d) => d.key === key)
    return item ? (lang === 'en' ? item.en : item.sw) : key
  }
  const rated = scores.filter((s) => typeof s.level === 'number')
  const lines = rated
    .slice()
    .sort((a, b) => (a.level || 0) - (b.level || 0))
    .map((s) => `- [${s.kind}] ${labelFor(s.kind, s.domain_key)}: Level ${s.level}`)
  const levelLegend = SCORE_LEVELS.map((l) => `${l.value}=${lang === 'en' ? l.en : l.sw}`).join(', ')
  return [
    `Score levels: ${levelLegend}.`,
    'Centre scores (lowest first):',
    lines.join('\n') || '(no scores available)',
    '',
    'List the 3–5 highest-priority areas to improve. For each: the area, why it matters, and 1–3 concrete next steps.'
  ].join('\n')
}

// ----------------------------------------------------------------- DB helpers
export async function listCurriculum(
  db: SupabaseClient,
  filters: { ageBand?: string; subject?: string }
): Promise<CurriculumCard[]> {
  let q = db.from('curriculum_items').select(
    'id, age_band, subject, title_sw, title_en, about_sw, about_en, materials_sw, materials_en, steps_sw, steps_en'
  ).order('sort_order', { ascending: true })
  if (filters.ageBand) q = q.eq('age_band', filters.ageBand)
  if (filters.subject) q = q.eq('subject', filters.subject)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data || []) as CurriculumCard[]
}

// Lightweight relevance pick: cards in the age band, ranked by theme word overlap.
export function rankCardsByTheme(cards: CurriculumCard[], theme: string, limit = 6): CurriculumCard[] {
  const words = theme.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  if (!words.length) return cards.slice(0, limit)
  const score = (c: CurriculumCard) => {
    const hay = `${c.title_sw} ${c.title_en} ${c.subject} ${c.about_sw} ${c.about_en}`.toLowerCase()
    return words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0)
  }
  return cards
    .map((c) => ({ c, s: score(c) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.c)
}

export async function saveLessonPlan(db: SupabaseClient, row: Record<string, unknown>): Promise<string> {
  const { data, error } = await db.from('lesson_plans').insert(row).select('id').single()
  if (error || !data) throw new Error(error?.message || 'failed to save lesson plan')
  return (data as { id: string }).id
}

export async function getLessonPlan(db: SupabaseClient, id: string): Promise<Record<string, unknown> | null> {
  const { data } = await db.from('lesson_plans').select('*').eq('id', id).maybeSingle()
  return (data as Record<string, unknown>) || null
}

export async function latestAssessmentScores(db: SupabaseClient, memberId: string): Promise<DomainScoreRow[]> {
  const { data: asm } = await db
    .from('rubric_assessments')
    .select('id')
    .eq('member_id', memberId)
    .order('assessed_on', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!asm) return []
  const { data: rows } = await db
    .from('rubric_domain_scores')
    .select('kind, domain_key, level')
    .eq('assessment_id', (asm as { id: string }).id)
  return (rows || []) as DomainScoreRow[]
}
