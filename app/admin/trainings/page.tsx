import { redirect } from 'next/navigation'

import { AdminNav } from '@/components/AdminNav'
import { TrainingsAdmin } from '@/components/TrainingsAdmin'
import { fetchTrainingsForOrg } from '@/lib/admin-data'
import { getCurrentUser } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminTrainingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'member') redirect('/portal')
  if (user.role === 'cic_staff') redirect('/dashboard')

  const tenant = getCurrentTenant()
  const trainings = await fetchTrainingsForOrg(tenant.id)

  return (
    <>
      <AdminNav fullName={user.full_name} role={user.role} currentTenantId={tenant.id} demoMode={!isSupabaseConfigured()} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 110px)', padding: '2rem 0' }}>
        <div className="container">
          <div style={{ marginBottom: '1.5rem' }}>
            <span className="section-tag">{tenant.label_en}</span>
            <h1 style={{ fontSize: '1.5rem', margin: '0.4rem 0 0.2rem 0' }}>Trainings</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
              Schedule new trainings; members register from /portal and the count updates here in real time.
            </p>
          </div>

          <TrainingsAdmin trainings={trainings} />
        </div>
      </main>
    </>
  )
}
