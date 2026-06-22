import Link from 'next/link'
import { fmtNum, fmtDate } from '@/lib/format'
import { notFound, redirect } from 'next/navigation'

import { AdminNav } from '@/components/AdminNav'
import { AiRecommendations } from '@/components/AiRecommendations'
import { AuditLog } from '@/components/journey2/AuditLog'
import { MembershipReview } from '@/components/journey2/MembershipReview'
import { PaymentForm } from '@/components/journey2/PaymentForm'
import { MembershipBadge, ProfileBadge } from '@/components/journey2/StatusBadges'
import { getCurrentUser } from '@/lib/auth'
import {
  fetchMemberDetail,
  fetchMembershipLogs,
  fetchMemberPayments
} from '@/lib/journey2-data'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'member') redirect('/portal')

  const tenant = getCurrentTenant()
  const canModerate = user.role === 'secretariat' || user.role === 'admin'

  const member = await fetchMemberDetail(params.id)
  if (!member) notFound()

  const [logs, payments] = await Promise.all([
    fetchMembershipLogs(member.id),
    fetchMemberPayments(member.id)
  ])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <AdminNav fullName={user.full_name} role={user.role} currentTenantId={tenant.id} demoMode={!isSupabaseConfigured()} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 110px)', padding: '2rem 0' }}>
        <div className="container">
          <Link href="/admin/members" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
            ← Back to members
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', margin: '0.75rem 0 1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', margin: '0 0 0.4rem 0' }}>{member.centre_name}</h1>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <MembershipBadge status={member.membership_status} />
                <ProfileBadge status={member.profile_public_status} />
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {member.ward} · {member.district} · joined {fmtDate(member.joined_at)}
                </span>
              </div>
            </div>
            <Link
              href={`/admin/members/${member.id}/profile`}
              className="btn btn-primary"
              style={{ pointerEvents: member.membership_status === 'approved' ? 'auto' : 'none', opacity: member.membership_status === 'approved' ? 1 : 0.5 }}
            >
              Moderate public profile →
            </Link>
          </div>

          {member.membership_status !== 'approved' && (
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '-0.75rem', marginBottom: '1.5rem' }}>
              Profile moderation unlocks once the membership is approved.
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
              <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Centre details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem' }}>
                <Detail label="Phone" value={member.phone} />
                <Detail label="Email" value={member.email ?? '—'} />
                <Detail label="Address" value={member.address ?? '—'} />
                <Detail label="Children" value={String(member.children_count)} />
                <Detail label="Caregivers" value={String(member.caregiver_count)} />
                <Detail label="License" value={member.license_status} />
                <Detail label="License #" value={member.license_number ?? '—'} />
                <Detail label="License expiry" value={member.license_expiry ?? '—'} />
                <Detail label="Consent: join" value={member.consent_join ? 'Yes' : '—'} />
                <Detail label="Consent: public listing" value={member.consent_public_listing ? 'Yes' : 'No'} />
              </div>
            </div>

            <MembershipReview memberId={member.id} status={member.membership_status} readOnly={!canModerate} />
          </div>

          <AiRecommendations memberId={member.id} centreName={member.centre_name} />

          <div style={{ marginBottom: '1.5rem' }}>
            <AuditLog title="Membership status history" entries={logs} />
          </div>

          <section style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
            <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Membership payments</h2>
            {canModerate && (
              <div style={{ marginBottom: '1.25rem' }}>
                <PaymentForm memberId={member.id} defaultDate={today} />
              </div>
            )}
            {payments.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No payments recorded yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                      <th style={pth}>Date</th>
                      <th style={pth}>Amount</th>
                      <th style={pth}>Method</th>
                      <th style={pth}>Reference</th>
                      <th style={pth}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={ptd}>{fmtDate(p.payment_date)}</td>
                        <td style={ptd}>
                          {p.currency} {fmtNum(Number(p.amount))}
                        </td>
                        <td style={ptd}>{p.method.replace('_', ' ')}</td>
                        <td style={ptd}>{p.reference_number}</td>
                        <td style={ptd}>{p.note ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '0.92rem', fontWeight: 500, marginTop: '0.1rem' }}>{value}</div>
    </div>
  )
}

const pth: React.CSSProperties = { padding: '0.5rem 0.6rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }
const ptd: React.CSSProperties = { padding: '0.5rem 0.6rem' }
