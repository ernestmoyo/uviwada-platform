import { redirect } from 'next/navigation'

import { AdminNav } from '@/components/AdminNav'
import { MembersTable } from '@/components/MembersTable'
import { fetchMembersForOrg } from '@/lib/admin-data'
import { getCurrentUser } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface AdminMembersPageProps {
  searchParams?: {
    q?: string
    ward?: string
    district?: string
    quality?: string
    license?: string
  }
}

export default async function AdminMembersPage({ searchParams }: AdminMembersPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'member') redirect('/portal')

  const tenant = getCurrentTenant()
  const members = await fetchMembersForOrg(tenant.id)
  const readOnly = user.role === 'cic_staff'
  const initialFilters = {
    q: searchParams?.q,
    ward: searchParams?.ward,
    district: searchParams?.district,
    quality: searchParams?.quality,
    license: searchParams?.license
  }

  return (
    <>
      <AdminNav fullName={user.full_name} role={user.role} currentTenantId={tenant.id} demoMode={!isSupabaseConfigured()} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 110px)', padding: '2rem 0' }}>
        <div className="container">
          <div style={{ marginBottom: '1.5rem' }}>
            <span className="section-tag">{tenant.label_en}</span>
            <h1 style={{ fontSize: '1.5rem', margin: '0.4rem 0 0.2rem 0' }}>Members · {members.length}</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
              Filter by ward, quality rating, or license status. Export filtered set as CSV for donor reporting.
            </p>
          </div>

          <MembersTable members={members} readOnly={readOnly} initialFilters={initialFilters} />
        </div>
      </main>
    </>
  )
}
