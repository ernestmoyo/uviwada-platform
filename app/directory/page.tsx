import Link from 'next/link'

import { DirectoryExplorer } from '@/components/directory/DirectoryExplorer'
import { fetchRubricSnapshot } from '@/lib/rubric-data'
import { buildDirectory } from '@/lib/directory'

export const revalidate = 60

export const metadata = {
  title: 'Find a Daycare — UVIWATA Directory',
  description: 'Search assessed daycare centres across Dar es Salaam by council, ownership and quality tier.'
}

export default async function DirectoryPage() {
  const snapshot = await fetchRubricSnapshot()
  const centres = buildDirectory(snapshot)
  const councils = Array.from(new Set(centres.map((c) => c.council).filter((x): x is string => !!x))).sort()
  const ownerships = Array.from(new Set(centres.map((c) => c.ownership).filter((x): x is string => !!x))).sort()
  const dc = snapshot.meta.dataCompleteness

  return (
    <main style={{ background: 'var(--bg-alt)', minHeight: '100vh' }}>
      <header style={{ background: 'var(--primary-dark)', color: '#fff', padding: '1.4rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ background: '#fff', borderRadius: 10, padding: '0.5rem 0.7rem', display: 'inline-flex' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/uviwata_logo.png" alt="UVIWATA — Mtoto Kwanza" style={{ height: 40, width: 'auto', display: 'block' }} />
            </span>
            <div>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.75 }}>UVIWATA · Find a Daycare</div>
              <h1 style={{ fontSize: '1.6rem', margin: '0.25rem 0 0' }}>Daycare Directory — Dar es Salaam</h1>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', opacity: 0.85 }}>
                {snapshot.meta.totalRecords} assessed centres. Search and filter by council, ownership and quality tier.
              </p>
            </div>
          </div>
          <Link href="/" style={{ color: '#fff', fontSize: '0.85rem', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.4)', padding: '0.45rem 0.9rem', borderRadius: 8 }}>
            ← Home
          </Link>
        </div>
      </header>

      <section style={{ padding: '1.75rem 0 3rem' }}>
        <div className="container">
          <div className="dir-disclaimer">
            <strong>Preliminary sector data.</strong> These are field-assessment records ({dc.date_from} → {dc.date_to}), shown for
            sector visibility. They are not yet consented public listings — contact details and photos are not published, and
            locations are approximate. Parents should make their own enquiries before enrolling a child.
          </div>
          <DirectoryExplorer centres={centres} councils={councils} ownerships={ownerships} />
        </div>
      </section>
    </main>
  )
}
