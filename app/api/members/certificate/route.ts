import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getCertificateForMember } from '@/lib/certificates'

// Current member's certificate status (for the portal certificate page).
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!user.member_id) return NextResponse.json({ status: 'none' })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const cert = await getCertificateForMember(supabase, user.member_id)
  if (!cert) return NextResponse.json({ status: 'none' })
  return NextResponse.json({
    status: cert.status,
    cert_ref: cert.cert_ref,
    period_label: cert.period_label,
    approved_at: cert.approved_at
  })
}
