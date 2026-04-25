import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['assessor', 'secretariat', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const form = await request.formData()
  const urls: string[] = []
  for (const [, file] of form.entries()) {
    if (typeof file === 'string') continue
    const f = file as File
    const ext = f.name.split('.').pop() || 'jpg'
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { data, error } = await supabase.storage.from('assessments').upload(path, f, {
      contentType: f.type || 'image/jpeg',
      upsert: false
    })
    if (error || !data) continue
    const { data: pub } = supabase.storage.from('assessments').getPublicUrl(data.path)
    if (pub?.publicUrl) urls.push(pub.publicUrl)
  }

  return NextResponse.json({ urls })
}
