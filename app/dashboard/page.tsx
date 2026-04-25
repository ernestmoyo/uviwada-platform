import { redirect } from 'next/navigation'

import { PortalNav } from '@/components/PortalNav'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <>
      <PortalNav fullName={user.full_name} ward={user.ward} role={user.role} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 60px)', padding: '2rem 0' }}>
        <div className="container">
          <span className="section-tag">M&amp;E Dashboard · Day 3</span>
          <h1 style={{ fontSize: '1.75rem', margin: '0.4rem 0 1.5rem 0' }}>CiC Programme View</h1>
          <div className="portal-form-card">
            <h3>Coming on Day 3</h3>
            <p>
              Live KPIs (total centres, children enrolled, % Green/Amber/Red, training attendance, license compliance),
              monthly trends, ward-level facets, NMECDP indicator status, CSV / PDF export to donor templates.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
