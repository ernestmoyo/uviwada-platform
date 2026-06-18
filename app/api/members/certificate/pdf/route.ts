import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getCertificateForMember } from '@/lib/certificates'

const NAVY = rgb(0.06, 0.24, 0.43) // #0F3D6E
const RED = rgb(0.83, 0.13, 0.15) // #D42027
const INK = rgb(0.12, 0.16, 0.22)

// Generate the issued membership certificate as a real PDF (Issue 12).
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!user.member_id) return NextResponse.json({ error: 'No member profile' }, { status: 404 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const cert = await getCertificateForMember(supabase, user.member_id)
  if (!cert || cert.status !== 'issued') {
    return NextResponse.json({ error: 'No issued certificate available' }, { status: 404 })
  }

  const { data: member } = await supabase
    .from('members')
    .select('centre_name, ward, district')
    .eq('id', user.member_id)
    .maybeSingle()
  const m = (member ?? {}) as { centre_name?: string; ward?: string; district?: string }
  const centreName = m.centre_name ?? user.full_name

  const pdf = await PDFDocument.create()
  const page = pdf.addPage([842, 595]) // A4 landscape
  const { width, height } = page.getSize()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const centre = (text: string, y: number, size: number, f = font, color = INK) => {
    const w = f.widthOfTextAtSize(text, size)
    page.drawText(text, { x: (width - w) / 2, y, size, font: f, color })
  }

  // border
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: NAVY, borderWidth: 2 })
  page.drawRectangle({ x: 24, y: height - 90, width: width - 48, height: 66, color: NAVY })

  centre('UVIWATA — MTOTO KWANZA', height - 62, 22, bold, rgb(1, 1, 1))
  centre('Certificate of Membership', height - 150, 30, bold, NAVY)
  centre('This certifies that the daycare centre', height - 200, 13, font)
  centre(centreName, height - 240, 26, bold, INK)
  centre(`of ${[m.ward, m.district].filter(Boolean).join(', ') || 'Dar es Salaam'}`, height - 268, 13, font)
  centre('is a member in good standing of UVIWATA for', height - 308, 13, font)
  centre(cert.period_label ?? 'the current membership period', height - 332, 16, bold, RED)

  const issued = cert.approved_at ? new Date(cert.approved_at).toISOString().slice(0, 10) : ''
  page.drawText(`Certificate No: ${cert.cert_ref ?? '—'}`, { x: 60, y: 70, size: 11, font: bold, color: INK })
  page.drawText(`Issued: ${issued}`, { x: 60, y: 52, size: 11, font, color: INK })
  const sigLabel = 'UVIWATA Secretariat'
  page.drawText(sigLabel, { x: width - 60 - bold.widthOfTextAtSize(sigLabel, 11), y: 52, size: 11, font: bold, color: INK })
  page.drawLine({ start: { x: width - 230, y: 72 }, end: { x: width - 60, y: 72 }, thickness: 1, color: INK })

  const bytes = await pdf.save()
  const filename = `${(cert.cert_ref ?? 'certificate').replace(/[^A-Za-z0-9-]/g, '_')}.pdf`
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
