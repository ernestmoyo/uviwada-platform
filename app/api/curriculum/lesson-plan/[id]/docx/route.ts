import { NextResponse } from 'next/server'
import { Packer } from 'docx'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { getLessonPlan, type LessonPlanStructured } from '@/lib/curriculum'
import { buildLessonDoc } from '@/lib/lesson-docx'

// GET /api/curriculum/lesson-plan/[id]/docx → branded, editable Word document.
// Cookie-gated (browser download). Builds a Tanzania-themed .docx from the stored plan.

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const row = await getLessonPlan(supabase, params.id)
  if (!row) return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })

  const plan = (row.structured as LessonPlanStructured) || null
  const doc = buildLessonDoc(plan, row)
  const buffer = await Packer.toBuffer(doc)
  const safeTitle = String(row.title || 'lesson-plan').replace(/[^a-z0-9\- ]/gi, '').trim().slice(0, 60) || 'lesson-plan'

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="UVIWATA - ${safeTitle}.docx"`
    }
  })
}
