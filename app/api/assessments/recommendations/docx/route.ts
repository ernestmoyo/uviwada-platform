import { NextResponse } from 'next/server'
import { Packer } from 'docx'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { buildRecommendationsDoc } from '@/lib/recommendations-docx'

// POST /api/assessments/recommendations/docx
// Body: { text, centreName?, lang? } → branded Word document (stateless; the
// recommendation text is generated client-side and passed straight through).
// Cookie-gated (browser download by staff/assessor).

const bodySchema = z.object({
  text: z.string().min(1).max(20000),
  centreName: z.string().max(160).optional(),
  lang: z.enum(['sw', 'en']).default('sw')
})

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let payload: z.infer<typeof bodySchema>
  try {
    payload = bodySchema.parse(await request.json())
  } catch (err) {
    return NextResponse.json({ error: 'Invalid body', detail: String(err) }, { status: 400 })
  }

  const doc = buildRecommendationsDoc({ text: payload.text, centreName: payload.centreName, lang: payload.lang, date: new Date() })
  const buffer = await Packer.toBuffer(doc)
  const safe = (payload.centreName || 'recommendations').replace(/[^a-z0-9\- ]/gi, '').trim().slice(0, 60) || 'recommendations'

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="UVIWATA - Areas to improve - ${safe}.docx"`
    }
  })
}
