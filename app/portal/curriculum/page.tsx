import Link from 'next/link'
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
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 60px)', padding: '1.5rem 0 2.5rem' }}>
        <div className="container">
          <Link href="/portal" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: '1.1rem' }}>
            ← {'Rudi kwenye kituo · Back to my centre'}
          </Link>
          <CurriculumStudio />
        </div>
      </main>
    </>
  )
}
