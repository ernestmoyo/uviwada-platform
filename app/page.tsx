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
import { WhyJoin } from '@/components/WhyJoin'
import { fetchRubricSnapshot } from '@/lib/rubric-data'
import { computeKpis, rubricToPublicCentres } from '@/lib/sector'

// ISR — re-fetch from Supabase at most once per minute. Avoids the visible
// flicker of force-dynamic + the prerender hazard of static. The rubric fetch
// uses the cookieless admin client so this page never touches next/headers and
// is safe to cache.
export const revalidate = 60

export default async function HomePage() {
  // One real-data source feeds the entire public homepage: hero counters, the
  // sector dashboard and the map all derive from the same 234-centre snapshot.
  const rubric = await fetchRubricSnapshot()
  const kpis = computeKpis(rubric.centres)
  const mapCentres = rubricToPublicCentres(rubric.centres)

  return (
    <>
      <TopBar />
      <NavBar />
      <main>
        <Hero centres={kpis.centres} councils={kpis.councils} children={kpis.children} />
        <About />
        <WhyJoin />
        <Services />
        <Dashboard centres={rubric.centres} meta={rubric.meta} source={rubric.source} />
        <MapSection centres={mapCentres} />
        <FieldToolSection />
        <PortalCta />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
