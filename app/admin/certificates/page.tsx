import { redirect } from 'next/navigation'

import { AdminNav } from '@/components/AdminNav'
import { CertificateApprovals } from '@/components/membership/CertificateApprovals'
import { getCurrentUser } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminCertificatesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'member') redirect('/portal')
  if (user.role === 'cic_staff') redirect('/dashboard')
  if (user.role === 'assessor') redirect('/assess')

  const tenant = getCurrentTenant()

  return (
    <>
      <AdminNav fullName={user.full_name} role={user.role} currentTenantId={tenant.id} demoMode={!isSupabaseConfigured()} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 110px)', padding: '2rem 0' }}>
        <div className="container">
          <div style={{ marginBottom: '1.25rem' }}>
            <span className="section-tag">Certificates · Vyeti</span>
            <h1 style={{ fontSize: '1.5rem', margin: '0.4rem 0 0.2rem 0' }}>Membership Certificate Approvals</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
              Approve and issue UVIWATA membership certificates. One Secretariat approval issues the certificate to the member.
            </p>
          </div>
          <CertificateApprovals approverName={user.full_name} />
        </div>
      </main>
    </>
  )
}
