import { redirect } from 'next/navigation'

import { AdminNav } from '@/components/AdminNav'
import { TrainingsAdmin } from '@/components/TrainingsAdmin'
import { fetchTrainingsForOrg, fetchTrainingRequestsForOrg } from '@/lib/admin-data'
import { getCurrentUser } from '@/lib/auth'
import { fmtDate } from '@/lib/format'
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
  const [trainings, requests] = await Promise.all([
    fetchTrainingsForOrg(tenant.id),
    fetchTrainingRequestsForOrg(tenant.id)
  ])
  const openRequests = requests.filter((r) => r.status === 'open')

  return (
    <>
      <AdminNav fullName={user.full_name} role={user.role} currentTenantId={tenant.id} demoMode={!isSupabaseConfigured()} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 110px)', padding: '2rem 0' }}>
        <div className="container">
          <div style={{ marginBottom: '1.5rem' }}>
            <span className="section-tag">{tenant.label_en.replace('UVIWADA', 'UVIWATA')}</span>
            <h1 style={{ fontSize: '1.5rem', margin: '0.4rem 0 0.2rem 0' }}>Trainings</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
              Schedule new trainings; members register from /portal and the count updates here in real time.
            </p>
          </div>

          {requests.length > 0 && (
            <section style={{ background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow)', padding: '1.25rem', marginBottom: '1.5rem', border: openRequests.length > 0 ? '1px solid #fcd34d' : '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>
                Training requests from DCCs {openRequests.length > 0 && <span style={{ color: '#b45309' }}>· {openRequests.length} open</span>}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0 0 0.85rem 0' }}>
                Topics members have asked for. Schedule a training above in response.
              </p>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {requests.map((r) => (
                  <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.6rem', alignItems: 'start', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.86rem' }}>
                    <div>
                      <strong>{r.topic ?? '—'}</strong>
                      {r.category ? <span style={{ color: 'var(--muted)' }}> · {r.category.replace('_', ' ')}</span> : null}
                      <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                        {r.member_name}{r.created_at ? ` · ${fmtDate(r.created_at)}` : ''}
                      </div>
                      {r.note ? <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>{r.note}</div> : null}
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: r.status === 'open' ? '#b45309' : 'var(--muted)' }}>{r.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <TrainingsAdmin trainings={trainings} />
        </div>
      </main>
    </>
  )
}
