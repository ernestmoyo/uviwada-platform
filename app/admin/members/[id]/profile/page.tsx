import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { AdminNav } from '@/components/AdminNav'
import { AiRecommendations } from '@/components/AiRecommendations'
import { AuditLog } from '@/components/journey2/AuditLog'
import { ProfileModeration } from '@/components/journey2/ProfileModeration'
import { MembershipBadge } from '@/components/journey2/StatusBadges'
import { getCurrentUser } from '@/lib/auth'
import { fetchMemberDetail, fetchProfileLogs, fetchProfileSections } from '@/lib/journey2-data'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProfileModerationPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'member') redirect('/portal')

  const tenant = getCurrentTenant()
  const canModerate = user.role === 'secretariat' || user.role === 'admin'

  const member = await fetchMemberDetail(params.id)
  if (!member) notFound()

  const [sections, logs] = await Promise.all([
    fetchProfileSections(member.id),
    fetchProfileLogs(member.id)
  ])

  return (
    <>
      <AdminNav fullName={user.full_name} role={user.role} currentTenantId={tenant.id} demoMode={!isSupabaseConfigured()} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 110px)', padding: '2rem 0' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <Link href={`/admin/members/${member.id}`} style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
            ← Back to member
          </Link>

          <div style={{ margin: '0.75rem 0 1.5rem' }}>
            <span className="section-tag">Profile Moderation</span>
            <h1 style={{ fontSize: '1.5rem', margin: '0.4rem 0 0.3rem' }}>{member.centre_name}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <MembershipBadge status={member.membership_status} />
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {member.ward} · {member.district}
              </span>
            </div>
          </div>

          {member.membership_status !== 'approved' ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: 'var(--shadow)' }}>
              <p style={{ margin: 0 }}>
                This member&apos;s profile cannot be moderated until the membership is approved. Approve it on the{' '}
                <Link href={`/admin/members/${member.id}`} style={{ color: 'var(--primary)' }}>
                  member detail page
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <ProfileModeration
                memberId={member.id}
                profileStatus={member.profile_public_status}
                sections={sections}
                readOnly={!canModerate}
              />
              <AiRecommendations memberId={member.id} centreName={member.centre_name} />
              <div style={{ marginTop: '1.25rem' }}>
                <AuditLog title="Public profile status history" entries={logs} />
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
