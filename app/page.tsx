import { About } from '@/components/About'
import { Contact } from '@/components/Contact'
import { Dashboard } from '@/components/Dashboard'
import { Footer } from '@/components/Footer'
import { Hero } from '@/components/Hero'
import { MapSection } from '@/components/MapSection'
import { NavBar } from '@/components/NavBar'
import { PortalCta } from '@/components/PortalCta'
import { Services } from '@/components/Services'
import { TopBar } from '@/components/TopBar'
import { fetchDashboardSnapshot, fetchPublicCentres } from '@/lib/data'

// Force dynamic so Vercel doesn't try to statically prerender the live data.
// fetchPublicCentres() / fetchDashboardSnapshot() use the cookieless admin
// client and try/catch back to seed values, so this is safe.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const [centres, snapshot] = await Promise.all([fetchPublicCentres(), fetchDashboardSnapshot()])

  const childrenReached = centres.reduce((acc, c) => acc + c.children, 0) * 6
  const totalMembersForHero = Math.max(snapshot.totalMembers, 150)

  return (
    <>
      <TopBar />
      <NavBar />
      <main>
        <Hero totalMembers={totalMembersForHero} childrenReached={childrenReached} />
        <About />
        <Services />
        <Dashboard snapshot={snapshot} />
        <MapSection centres={centres} />
        <PortalCta />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
