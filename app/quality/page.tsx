import Link from 'next/link'

import { QualityExplorer } from '@/components/quality/QualityExplorer'
import { fetchRubricSnapshot } from '@/lib/rubric-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Daycare Quality — Preliminary Results | UVIWATA',
  description: 'Preliminary results from the UVIWATA daycare quality rubric, Dar es Salaam.'
}

export default async function QualityPage() {
  const snapshot = await fetchRubricSnapshot()

  return (
    <main style={{ background: 'var(--bg-alt)', minHeight: '100vh' }}>
      <header style={{ background: 'var(--primary-dark, #0B2545)', color: '#fff', padding: '1.4rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.75 }}>
              UVIWATA · Daycare Quality
            </div>
            <h1 style={{ fontSize: '1.6rem', margin: '0.25rem 0 0' }}>Preliminary Quality Results — Dar es Salaam</h1>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', opacity: 0.85 }}>
              {snapshot.meta.totalRecords} day care centres assessed on the national quality rubric. Explore by council, ownership and tier.
            </p>
          </div>
          <Link href="/" style={{ color: '#fff', fontSize: '0.85rem', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.4)', padding: '0.45rem 0.9rem', borderRadius: 8 }}>
            ← Home
          </Link>
        </div>
      </header>

      <section style={{ padding: '1.75rem 0 3rem' }}>
        <div className="container">
          <QualityExplorer snapshot={snapshot} />
        </div>
      </section>
    </main>
  )
}
