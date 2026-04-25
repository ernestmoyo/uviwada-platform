import { redirect } from 'next/navigation'

import { AssessmentForm } from '@/components/AssessmentForm'
import { PortalNav } from '@/components/PortalNav'
import { fetchMembersForOrg } from '@/lib/admin-data'
import { getCurrentUser } from '@/lib/auth'
import { getCurrentTenantId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AssessPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!['assessor', 'secretariat', 'admin'].includes(user.role)) redirect('/')

  const tenantId = getCurrentTenantId()
  const members = await fetchMembersForOrg(tenantId)
  const assignedMembers = user.ward
    ? members.filter((m) => m.ward === user.ward)
    : members

  return (
    <>
      <PortalNav fullName={user.full_name} ward={user.ward} role={user.role} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 60px)', padding: '1.5rem 0' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <span className="section-tag">On-site Quality Assessment</span>
          <h1 style={{ fontSize: '1.5rem', margin: '0.4rem 0 0.2rem 0' }}>
            {user.ward ? `${user.ward} ward` : 'All centres'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            {assignedMembers.length} centre{assignedMembers.length === 1 ? '' : 's'} in your scope. Tap each item;
            the rating updates live.
          </p>

          <AssessmentForm
            members={assignedMembers.map((m) => ({ id: m.id, centre_name: m.centre_name, ward: m.ward }))}
            variant="field"
          />
        </div>
      </main>
    </>
  )
}
