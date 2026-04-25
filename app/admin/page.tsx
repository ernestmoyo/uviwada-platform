import { redirect } from 'next/navigation'

import { PortalNav } from '@/components/PortalNav'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'member') redirect('/portal')

  return (
    <>
      <PortalNav fullName={user.full_name} ward={user.ward} role={user.role} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 60px)', padding: '2rem 0' }}>
        <div className="container">
          <span className="section-tag">Secretariat Console · Day 3</span>
          <h1 style={{ fontSize: '1.75rem', margin: '0.4rem 0 1.5rem 0' }}>
            Welcome, {user.full_name.split(' ')[0]}
          </h1>
          <div className="portal-form-card">
            <h3>Coming on Day 3</h3>
            <p>
              Members table (filter by ward / quality / license), trainings CRUD with attendance + certificate
              generation, assessments entry (the same 30-item form), announcements CRUD, safeguarding incidents view,
              tenant switcher (UVIWADA-DAR ↔ UVIWATA-NATIONAL ↔ UVIWAKI-KILIMANJARO), CSV / PDF exports.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
