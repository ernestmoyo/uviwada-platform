import { About } from '@/components/About'
import { Contact } from '@/components/Contact'
import { Dashboard } from '@/components/Dashboard'
import { FieldToolSection } from '@/components/FieldToolSection'
import { Footer } from '@/components/Footer'
import { Hero } from '@/components/Hero'
import { MapSection } from '@/components/MapSection'
import { NavBar } from '@/components/NavBar'
import { PortalCta } from '@/components/PortalCta'
import { Services } from '@/components/Services'
import { TopBar } from '@/components/TopBar'
import { fetchDashboardSnapshot, fetchPublicCentres } from '@/lib/data'

// ISR — re-fetch from Supabase at most once per minute. Avoids the visible
// flicker of force-dynamic + the prerender hazard of static. Both data
// fetches use the cookieless admin client so this page never touches
// next/headers and is safe to cache.
export const revalidate = 60

export default async function HomePage() {
  const [centres, snapshot] = await Promise.all([fetchPublicCentres(), fetchDashboardSnapshot()])

  // Hero shows the real live count from Supabase. Children-reached is a
  // soft estimate (avg of 6 children turn over per centre per year).
  const childrenReached = centres.reduce((acc, c) => acc + c.children, 0) * 6

  return (
    <>
      <TopBar />
      <NavBar />
      <main>
        <Hero totalMembers={snapshot.totalMembers} childrenReached={childrenReached} />
        <About />
        <Services />
        <Dashboard snapshot={snapshot} />
        <MapSection centres={centres} />
        <FieldToolSection />
        <PortalCta />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
