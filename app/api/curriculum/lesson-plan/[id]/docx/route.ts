import { NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { getLessonPlan, type LessonPlanStructured } from '@/lib/curriculum'

// GET /api/curriculum/lesson-plan/[id]/docx → editable Word document.
// Cookie-gated (browser download). Builds a .docx from the stored lesson plan.

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const row = await getLessonPlan(supabase, params.id)
  if (!row) return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })

  const p = (row.structured as LessonPlanStructured) || null
  const lang = (row.lang as string) === 'en' ? 'en' : 'sw'
  const L = lang === 'en'
    ? { obj: 'Objectives', mat: 'Materials', intro: 'Introduction', steps: 'Steps', assess: 'Assessment', notes: 'Notes' }
    : { obj: 'Malengo', mat: 'Vifaa', intro: 'Utangulizi', steps: 'Hatua', assess: 'Tathmini', notes: 'Maelezo' }

  const children: Paragraph[] = []
  const heading = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } })
  const bullet = (text: string) => new Paragraph({ text, bullet: { level: 0 } })

  if (p) {
    children.push(new Paragraph({ text: p.title, heading: HeadingLevel.TITLE }))
    children.push(new Paragraph({ children: [new TextRun({ text: `${p.age_band} · ${p.theme}${p.duration_minutes ? ` · ${p.duration_minutes} min` : ''}`, italics: true })], spacing: { after: 200 } }))
    children.push(heading(L.obj)); p.objectives.forEach((o) => children.push(bullet(o)))
    children.push(heading(L.mat)); p.materials.forEach((m) => children.push(bullet(m)))
    children.push(heading(L.intro), new Paragraph(p.introduction))
    children.push(heading(L.steps))
    p.steps.forEach((s, i) => children.push(new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${s.title}: `, bold: true }), new TextRun(s.detail)] })))
    children.push(heading(L.assess), new Paragraph(p.assessment))
    if (p.notes) { children.push(heading(L.notes), new Paragraph(p.notes)) }
  } else {
    // Fallback: render the stored markdown as plain paragraphs.
    children.push(new Paragraph({ text: String(row.title || 'Lesson plan'), heading: HeadingLevel.TITLE }))
    String(row.content || '').split('\n').forEach((line) => children.push(new Paragraph(line)))
  }

  const doc = new Document({ sections: [{ children }] })
  const buffer = await Packer.toBuffer(doc)
  const safeTitle = String(row.title || 'lesson-plan').replace(/[^a-z0-9\- ]/gi, '').trim().slice(0, 60) || 'lesson-plan'

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${safeTitle}.docx"`
    }
  })
}
