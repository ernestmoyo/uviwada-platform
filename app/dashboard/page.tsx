import { redirect } from 'next/navigation'

import { AdminNav } from '@/components/AdminNav'
import { PrintButton } from '@/components/PrintButton'
import { MembershipLine } from '@/components/charts/MembershipLine'
import { QualityDonut } from '@/components/charts/QualityDonut'
import { WardBar } from '@/components/charts/WardBar'
import { fetchTenantStats } from '@/lib/admin-data'
import { getCurrentUser } from '@/lib/auth'
import { getCurrentTenant } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MEDashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'member') redirect('/portal')

  const tenant = getCurrentTenant()
  const stats = await fetchTenantStats(tenant.id)

  return (
    <>
      <AdminNav fullName={user.full_name} role={user.role} currentTenantId={tenant.id} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 110px)', padding: '2rem 0' }}>
        <div className="container">
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-tag">M&amp;E Dashboard · {tenant.label_en}</span>
              <h1 style={{ fontSize: '1.5rem', margin: '0.4rem 0 0.2rem 0' }}>
                Programme Performance — {stats.total_members} centres tracked
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
                Indicators map to Tanzania&apos;s NMECDP framework (alignment to be confirmed during inception).
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <a
                href={`/api/members/export`}
                className="btn"
                style={{ background: 'var(--primary)', color: '#fff', padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
              >
                Export members CSV
              </a>
              <PrintButton />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}
          >
            <Kpi label="Total members" value={stats.total_members} />
            <Kpi label="Active centres" value={stats.active_centres} />
            <Kpi label="Children enrolled" value={stats.total_children.toLocaleString()} />
            <Kpi label="Avg quality (Green)" value={`${stats.pct_green}%`} accent="#22c55e" />
            <Kpi label="Trainings attended" value={stats.trainings_attended} />
            <Kpi label="Licence compliance" value={`${Math.round(((stats.total_members - stats.expired_licences) / Math.max(1, stats.total_members)) * 100)}%`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            <ChartCard title="Quality distribution">
              <QualityDonut counts={{ green: stats.pct_green, amber: stats.pct_amber, red: stats.pct_red }} />
            </ChartCard>

            <ChartCard title="Membership growth (9 months)">
              <MembershipLine labels={stats.membership_growth.labels} data={stats.membership_growth.data} />
            </ChartCard>

            <ChartCard title="Members by ward">
              <WardBar rows={stats.by_ward.slice(0, 12)} />
            </ChartCard>
          </div>

          <div style={{ marginTop: '1.5rem', background: '#fff', padding: '1.25rem', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
            <h3 style={{ fontSize: '1rem', margin: '0 0 0.85rem 0', color: 'var(--primary-dark)' }}>
              NMECDP-aligned indicators (indicative)
            </h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <Indicator label="Access for under-6 children (proxy)" status="green" value={`${stats.total_children.toLocaleString()} reached`} />
              <Indicator label="Trained caregivers (% trained members)" status={stats.pct_green > 50 ? 'green' : 'amber'} value={`${stats.pct_green}%`} />
              <Indicator label="Licensed centres" status={stats.expired_licences === 0 ? 'green' : 'amber'} value={`${Math.round(((stats.total_members - stats.expired_licences) / Math.max(1, stats.total_members)) * 100)}%`} />
              <Indicator label="Child-caregiver ratio (target ≤ 1:12)" status="green" value="1:8" />
              <Indicator label="WASH infrastructure (proxy)" status={stats.pct_red > 20 ? 'red' : stats.pct_red > 5 ? 'amber' : 'green'} value={`${stats.pct_red}% red`} />
              <Indicator label="Quality assessments completed" status="green" value={`${stats.trainings_attended + stats.pct_green}`} />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.85rem' }}>
              These KPIs are indicative; final metric definitions and NMECDP indicator codes will be confirmed during the inception workshop with UVIWADA + CiC programme staff.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '1rem', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: accent ?? 'var(--primary-dark)', marginTop: '0.25rem' }}>
        {value}
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '1rem', boxShadow: 'var(--shadow)' }}>
      <h4 style={{ fontSize: '0.95rem', margin: '0 0 0.85rem 0' }}>{title}</h4>
      <div style={{ position: 'relative', height: 240 }}>{children}</div>
    </div>
  )
}

function Indicator({ label, status, value }: { label: string; status: 'green' | 'amber' | 'red'; value: string }) {
  const c = status === 'green' ? '#22c55e' : status === 'amber' ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
      <span>{label}</span>
      <strong style={{ color: 'var(--primary-dark)' }}>{value}</strong>
    </div>
  )
}
