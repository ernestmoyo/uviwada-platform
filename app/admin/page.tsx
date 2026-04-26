import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AdminNav } from '@/components/AdminNav'
import { fetchTenantStats } from '@/lib/admin-data'
import { getCurrentUser } from '@/lib/auth'
import { getCurrentTenant } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminOverviewPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'member') redirect('/portal')

  const tenant = getCurrentTenant()
  const stats = await fetchTenantStats(tenant.id)

  const roleLabel =
    user.role === 'admin'
      ? 'Platform Admin Console'
      : user.role === 'cic_staff'
        ? 'CiC Programme Console'
        : user.role === 'assessor'
          ? 'Assessor Console'
          : 'Secretariat Console'

  return (
    <>
      <AdminNav fullName={user.full_name} role={user.role} currentTenantId={tenant.id} />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 110px)', padding: '2rem 0' }}>
        <div className="container">
          <div style={{ marginBottom: '1.5rem' }}>
            <span className="section-tag">{roleLabel}</span>
            <h1 style={{ fontSize: '1.75rem', margin: '0.4rem 0 0.2rem 0' }}>{tenant.label_en}</h1>
            <div style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
              {tenant.scope === 'national' ? 'National federation view' : 'Regional association view'}
              {' · '}
              {stats.total_members} members
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}
          >
            <Kpi label="Total members" value={stats.total_members} />
            <Kpi label="Active centres" value={stats.active_centres} />
            <Kpi label="Children enrolled" value={stats.total_children.toLocaleString()} />
            <Kpi label="Quality green" value={`${stats.pct_green}%`} accent="#22c55e" />
            <Kpi label="Quality amber" value={`${stats.pct_amber}%`} accent="#f59e0b" />
            <Kpi label="Quality red" value={`${stats.pct_red}%`} accent="#ef4444" />
            <Kpi label="Upcoming trainings" value={stats.trainings_upcoming} />
            <Kpi label="Trainings attended" value={stats.trainings_attended} />
            <Kpi label="Expired licences" value={stats.expired_licences} accent="#ef4444" />
            <Kpi label="Expiring in 30 d" value={stats.expiring_30d} accent="#f59e0b" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <BigCard title={`Members by ward (${stats.by_ward.length})`}>
              {stats.by_ward.slice(0, 10).map((row) => (
                <Row key={row.ward} label={row.ward} value={row.count} />
              ))}
            </BigCard>

            <BigCard title={`Members by district (${stats.by_district.length})`}>
              {stats.by_district.map((row) => (
                <Row key={row.district} label={row.district} value={row.count} />
              ))}
            </BigCard>

            <BigCard title="Quick actions">
              <ActionLink href="/admin/members">View all members →</ActionLink>
              <ActionLink href="/admin/trainings">Manage trainings →</ActionLink>
              <ActionLink href="/admin/assessments">Record assessment →</ActionLink>
              <ActionLink href="/admin/announcements">Post announcement →</ActionLink>
              <ActionLink href="/dashboard">Open M&amp;E dashboard →</ActionLink>
            </BigCard>
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

function BigCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
      <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.85rem 0', color: 'var(--primary-dark)' }}>{title}</h3>
      <div style={{ display: 'grid', gap: '0.4rem' }}>{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
      <span>{label}</span>
      <strong style={{ color: 'var(--primary-dark)' }}>{value}</strong>
    </div>
  )
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', padding: '0.25rem 0' }}>
      {children}
    </Link>
  )
}
