import Link from 'next/link'
import { redirect } from 'next/navigation'

import { MembershipPanel } from '@/components/membership/MembershipPanel'
import { PortalNav } from '@/components/PortalNav'
import { getCurrentUser } from '@/lib/auth'
import { fetchPortalSnapshot } from '@/lib/portal-data'
import { isSupabaseConfigured } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function MembershipPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'member') redirect('/admin')
  if (!user.member_id) redirect('/portal/register')

  const snapshot = await fetchPortalSnapshot(user.member_id)
  const centreName = snapshot.centre?.centre_name ?? user.full_name

  return (
    <>
      <PortalNav fullName={user.full_name} ward={user.ward} role="Member" demoMode={!isSupabaseConfigured()} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 60px)', padding: '2rem 0' }}>
        <div className="container">
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div>
              <span className="section-tag">Membership & Payments · Uanachama na Malipo</span>
              <h1 style={{ fontSize: '1.75rem', margin: '0.4rem 0 0.2rem 0' }}>{centreName}</h1>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{snapshot.centre ? `${snapshot.centre.ward} · ${snapshot.centre.district}` : ''}</div>
            </div>
            <Link
              href="/portal"
              className="btn btn-outline"
              style={{ color: 'var(--primary-dark)', borderColor: 'var(--primary-dark)' }}
            >
              ← My Centre
            </Link>
          </div>

          <MembershipPanel memberId={user.member_id} centreName={centreName} />
        </div>
      </main>
    </>
  )
}
