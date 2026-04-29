import { redirect } from 'next/navigation'

import { AdminNav } from '@/components/AdminNav'
import { AssessmentForm } from '@/components/AssessmentForm'
import { fetchAssessmentsForOrg, fetchMembersForOrg } from '@/lib/admin-data'
import { getCurrentUser } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminAssessmentsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'member') redirect('/portal')
  if (user.role === 'cic_staff') redirect('/dashboard')

  const tenant = getCurrentTenant()
  const [members, assessments] = await Promise.all([
    fetchMembersForOrg(tenant.id),
    fetchAssessmentsForOrg(tenant.id, 30)
  ])

  return (
    <>
      <AdminNav fullName={user.full_name} role={user.role} currentTenantId={tenant.id} demoMode={!isSupabaseConfigured()} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 110px)', padding: '2rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="section-tag">{tenant.label_en}</span>
              <h1 style={{ fontSize: '1.5rem', margin: '0.4rem 0 0.2rem 0' }}>Record an assessment</h1>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
                30-item ECCE checklist across 6 dimensions. Score updates the centre&apos;s traffic light immediately.
              </p>
            </div>

            <AssessmentForm members={members.map((m) => ({ id: m.id, centre_name: m.centre_name, ward: m.ward }))} variant="admin" />
          </div>

          <aside>
            <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.85rem 0', color: 'var(--primary-dark)' }}>
                Recent assessments ({assessments.length})
              </h3>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.85rem' }}>
                {assessments.length === 0 && (
                  <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No assessments yet.</p>
                )}
                {assessments.map((a) => {
                  const colour = a.rating === 'green' ? '#22c55e' : a.rating === 'amber' ? '#f59e0b' : '#ef4444'
                  return (
                    <div
                      key={a.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        gap: '0.5rem',
                        alignItems: 'center',
                        padding: '0.4rem 0',
                        borderBottom: '1px solid var(--border)'
                      }}
                    >
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: colour }} />
                      <div>
                        <strong style={{ fontSize: '0.85rem' }}>{a.member_name}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                          {new Date(a.conducted_at).toLocaleDateString()} · {a.source}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        {a.score_total}/{a.score_max}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  )
}
