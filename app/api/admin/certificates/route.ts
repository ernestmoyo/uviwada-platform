import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { issueCertificate } from '@/lib/certificates'

const ADMIN_ROLES = new Set(['secretariat', 'admin'])

// List certificate requests + issued certificates (with centre name) for the queue.
export async function GET() {
  const user = await getCurrentUser()
  if (!user || !ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const { data, error } = await supabase
    .from('certificates')
    .select('id, member_id, status, cert_ref, period_label, requested_at, approved_at, members(centre_name, ward)')
    .in('status', ['requested', 'issued'])
    .order('requested_at', { ascending: false })

  if (error) {
    // Before migration 0006 is applied the table doesn't exist — degrade to an
    // empty queue instead of erroring the admin page.
    console.error('certificates: list failed (is migration 0006 applied?)', error.message)
    return NextResponse.json({ items: [] })
  }

  type Row = {
    id: string; member_id: string; status: string; cert_ref: string | null; period_label: string | null
    requested_at: string; approved_at: string | null; members: { centre_name: string | null; ward: string | null } | null
  }
  const items = ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    member_id: r.member_id,
    status: r.status,
    cert_ref: r.cert_ref,
    period_label: r.period_label,
    requested_at: r.requested_at,
    approved_at: r.approved_at,
    centre_name: r.members?.centre_name ?? '—',
    ward: r.members?.ward ?? null
  }))
  return NextResponse.json({ items })
}

// Approve & issue a certificate.
const issueSchema = z.object({ id: z.string().uuid() })
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const parsed = issueSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const cert = await issueCertificate(supabase, parsed.data.id, user.id)
  if (!cert) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  return NextResponse.json({ ok: true, cert_ref: cert.cert_ref })
}
