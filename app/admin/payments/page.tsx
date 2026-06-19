import { redirect } from 'next/navigation'
import { fmtNum, fmtDate } from '@/lib/format'
import Link from 'next/link'

import { AdminNav } from '@/components/AdminNav'
import { PaymentsRecorder } from '@/components/journey2/PaymentsRecorder'
import { PaymentsToVerify } from '@/components/journey2/PaymentsToVerify'
import { fetchMembersForOrg } from '@/lib/admin-data'
import { fetchRecentPayments, fetchPendingPayments } from '@/lib/journey2-data'
import { getCurrentUser } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPaymentsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'member') redirect('/portal')
  const canRecord = user.role === 'secretariat' || user.role === 'admin'
  if (!canRecord) redirect('/admin')

  const tenant = getCurrentTenant()
  const [members, payments, pendingPayments] = await Promise.all([
    fetchMembersForOrg(tenant.id),
    fetchRecentPayments(tenant.id),
    fetchPendingPayments(tenant.id)
  ])
  const today = new Date().toISOString().slice(0, 10)
  const memberOptions = members.map((m) => ({ id: m.id, centre_name: m.centre_name, ward: m.ward }))

  return (
    <>
      <AdminNav fullName={user.full_name} role={user.role} currentTenantId={tenant.id} demoMode={!isSupabaseConfigured()} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 110px)', padding: '2rem 0' }}>
        <div className="container">
          <div style={{ marginBottom: '1.5rem' }}>
            <span className="section-tag">{tenant.label_en.replace('UVIWADA', 'UVIWATA')}</span>
            <h1 style={{ fontSize: '1.5rem', margin: '0.4rem 0 0.2rem 0' }}>Membership Payments</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
              Record payments manually. Reference number and method are always required, including cash.
            </p>
          </div>

          <PaymentsToVerify payments={pendingPayments} />

          <section style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow)', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Record a payment</h2>
            <PaymentsRecorder members={memberOptions} defaultDate={today} />
          </section>

          <section style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
            <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Recent payments</h2>
            {payments.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No payments recorded yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                      <th style={th}>Date</th>
                      <th style={th}>Member</th>
                      <th style={th}>Amount</th>
                      <th style={th}>Method</th>
                      <th style={th}>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={td}>{fmtDate(p.payment_date)}</td>
                        <td style={td}>
                          <Link href={`/admin/members/${p.member_id}`} style={{ color: 'var(--primary)' }}>
                            {p.centre_name}
                          </Link>
                        </td>
                        <td style={td}>
                          {p.currency} {fmtNum(Number(p.amount))}
                        </td>
                        <td style={td}>{p.method.replace('_', ' ')}</td>
                        <td style={td}>{p.reference_number}</td>
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

const th: React.CSSProperties = { padding: '0.5rem 0.6rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }
const td: React.CSSProperties = { padding: '0.5rem 0.6rem' }
