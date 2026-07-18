import { redirect } from 'next/navigation'

import { RubricAssessmentForm } from '@/components/RubricAssessmentForm'
import { InstallPrompt } from '@/components/InstallPrompt'
import { OfflineBanner } from '@/components/OfflineBanner'
import { PortalNav } from '@/components/PortalNav'
import { fetchAssessableMembers } from '@/lib/admin-data'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AssessPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!['assessor', 'secretariat', 'admin'].includes(user.role)) redirect('/')

  // Assessors can assess ANY registered centre, not only their home ward/org.
  // fetchAssessableMembers returns every REAL member (no org filter, no demo
  // fallback) so the web form stays in sync with the mobile field feed and only
  // ever submits member_ids that exist in the DB.
  const assignedMembers = await fetchAssessableMembers()

  return (
    <>
      <PortalNav fullName={user.full_name} ward={user.ward} role={user.role} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 60px)', padding: '1.5rem 0' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <span className="section-tag">On-site Quality Assessment</span>
          <h1 style={{ fontSize: '1.5rem', margin: '0.4rem 0 0.2rem 0' }}>All centres</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            {assignedMembers.length} registered centre{assignedMembers.length === 1 ? '' : 's'} available to assess. Pick a
            centre, tap each item; the rating updates live. Works fully offline once installed.
          </p>

          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <InstallPrompt compact />
          </div>

          {assignedMembers.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
              <p style={{ fontWeight: 700, marginBottom: '0.35rem' }}>No registered centres to assess yet</p>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
                Centres appear here once they are registered on the platform. Please try again after the next sync.
              </p>
            </div>
          ) : (
            <RubricAssessmentForm
              members={assignedMembers.map((m) => ({ id: m.id, centre_name: m.centre_name, ward: m.ward }))}
            />
          )}
        </div>
      </main>
      <OfflineBanner />
    </>
  )
}
