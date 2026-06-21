import { redirect } from 'next/navigation'

import { CurriculumStudio } from '@/components/CurriculumStudio'
import { PortalNav } from '@/components/PortalNav'
import { getCurrentUser } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CurriculumPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'member') redirect('/admin')
  if (!user.member_id) redirect('/portal/register')

  return (
    <>
      <PortalNav fullName={user.full_name} ward={user.ward} role="Member" demoMode={!isSupabaseConfigured()} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 60px)', padding: '2rem 0' }}>
        <div className="container">
          <div style={{ marginBottom: '1.25rem' }}>
            <span className="section-tag">Curriculum · Mtaala</span>
            <h1 style={{ fontSize: '1.6rem', margin: '0.4rem 0 0.2rem 0' }}>Curriculum &amp; lesson plans</h1>
            <div style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>
              AI-assisted lesson plans from the official NECDP curriculum (ages 2–5). Bilingual · downloadable as Word.
            </div>
          </div>
          <CurriculumStudio />
        </div>
      </main>
    </>
  )
}
