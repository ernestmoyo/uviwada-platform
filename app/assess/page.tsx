import { redirect } from 'next/navigation'

import { PortalNav } from '@/components/PortalNav'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AssessPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <>
      <PortalNav fullName={user.full_name} ward={user.ward} role={user.role} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 60px)', padding: '2rem 0' }}>
        <div className="container">
          <span className="section-tag">Quality Assessment · Day 4</span>
          <h1 style={{ fontSize: '1.75rem', margin: '0.4rem 0 1.5rem 0' }}>On-site Quality Assessment</h1>
          <div className="portal-form-card">
            <h3>Coming on Day 4</h3>
            <p>
              30-item ECCE checklist across the 6 dimensions (infrastructure, staffing, curriculum, health &amp; hygiene,
              safeguarding, nutrition). Mobile-first. GPS auto-capture, photo upload to Supabase Storage. The Android
              APK ships the same form with offline queue + sync.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
