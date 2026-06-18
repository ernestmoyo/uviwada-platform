import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

// Centre owners can edit their own contact + licensing details (Issue 4).
// The target row is ALWAYS derived from the session (user.member_id) — the
// client cannot pass an arbitrary member id, so an owner can only ever
// update their own centre.
const updateSchema = z.object({
  phone: z.string().min(7).max(40),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  caregiver_count: z.coerce.number().int().min(0).max(100),
  license_status: z.enum(['fully_licensed', 'pending', 'not_applied', 'expired']),
  license_number: z.string().max(120).optional().or(z.literal('')),
  license_expiry: z.string().optional().or(z.literal(''))
})

const FIELD_LABELS: Record<string, string> = {
  phone: 'Phone · Simu',
  email: 'Email',
  address: 'Address · Anwani',
  caregiver_count: 'Caregivers · Walezi',
  license_status: 'License Status',
  license_number: 'License Number',
  license_expiry: 'License Expiry'
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (user.role !== 'member' || !user.member_id) {
    return NextResponse.json({ error: 'Only centre owners can edit centre details' }, { status: 403 })
  }

  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => {
      const field = String(issue.path[0] ?? '')
      return { field, label: FIELD_LABELS[field] ?? field, message: issue.message }
    })
    return NextResponse.json(
      { error: 'Please fix: ' + fields.map((f) => f.label).join(', '), fields },
      { status: 400 }
    )
  }
  const data = parsed.data

  if (!isSupabaseConfigured()) {
    // Demo mode has no persistent store — accept the edit optimistically so
    // the pitch UI still reflects the change after a refresh-free update.
    return NextResponse.json({ ok: true, demo: true })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const { error } = await supabase
    .from('members')
    .update({
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      caregiver_count: data.caregiver_count,
      license_status: data.license_status,
      license_number: data.license_number || null,
      license_expiry: data.license_expiry || null
    })
    .eq('id', user.member_id)

  if (error) {
    console.error('members/update: failed', error)
    return NextResponse.json({ error: 'Could not save your changes. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
