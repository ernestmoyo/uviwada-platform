import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AnnouncementsList } from '@/components/AnnouncementsList'
import { LicenseCard } from '@/components/LicenseCard'
import { PortalNav } from '@/components/PortalNav'
import { TrafficLightCard } from '@/components/TrafficLightCard'
import { TrainingsList } from '@/components/TrainingsList'
import { getCurrentUser } from '@/lib/auth'
import { fetchPortalSnapshot } from '@/lib/portal-data'

export const dynamic = 'force-dynamic'

export default async function PortalPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'member') {
    // staff users land on their own dashboards
    redirect('/admin')
  }
  if (!user.member_id) {
    redirect('/portal/register')
  }

  const snapshot = await fetchPortalSnapshot(user.member_id)
  const centre = snapshot.centre

  return (
    <>
      <PortalNav fullName={user.full_name} ward={user.ward} role="Member" />
      <main style={{ background: 'var(--bg-alt)', minHeight: 'calc(100vh - 60px)', padding: '2rem 0' }}>
        <div className="container">
          {!centre ? (
            <div className="portal-form-card">
              <h2>Centre not found</h2>
              <p>
                We couldn&apos;t load your centre profile. Please <Link href="/portal/register">re-register</Link> or
                contact the secretariat.
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <span className="section-tag">My Centre · Kituo Changu</span>
                <h1 style={{ fontSize: '1.75rem', margin: '0.4rem 0 0.2rem 0' }}>{centre.centre_name}</h1>
                <div style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
                  {centre.ward} · {centre.district} · joined {new Date(centre.joined_at).toLocaleDateString()}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}
              >
                <TrafficLightCard rating={centre.latest_quality} />
                <LicenseCard
                  status={centre.license_status}
                  number={centre.license_number}
                  expiry={centre.license_expiry}
                />
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow)'
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Children · Watoto
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                    {centre.children_count}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                    {centre.age_band_0_2} · {centre.age_band_3_4} · {centre.age_band_5_6} (0–2 / 3–4 / 5–6 yrs)
                  </div>
                </div>
              </div>

              {snapshot.recommended.length > 0 && (
                <section style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
                    Recommended Trainings · Mafunzo Yaliyopendekezwa
                  </h2>
                  <div
                    style={{
                      background: 'var(--accent-light)',
                      borderLeft: '3px solid var(--accent)',
                      padding: '1rem 1.25rem',
                      borderRadius: 8
                    }}
                  >
                    {snapshot.recommended.map((r) => (
                      <div key={r.id} style={{ marginBottom: '0.5rem' }}>
                        <strong>{r.title_en}</strong>{' '}
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>— {r.reason_en}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
                  Upcoming Trainings · Mafunzo Yajayo
                </h2>
                <TrainingsList trainings={snapshot.upcoming} />
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
                  Announcements · Matangazo
                </h2>
                <AnnouncementsList items={snapshot.announcements} />
              </section>

              <section>
                <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Centre Details · Maelezo ya Kituo</h2>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}
                >
                  <Detail label="Phone · Simu" value={centre.phone} />
                  <Detail label="Email" value={centre.email ?? '—'} />
                  <Detail label="Caregivers · Walezi" value={String(centre.caregiver_count)} />
                  <Detail label="License #" value={centre.license_number ?? '—'} />
                  <Detail label="License Expiry" value={centre.license_expiry ?? '—'} />
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 500, marginTop: '0.15rem' }}>{value}</div>
    </div>
  )
}
