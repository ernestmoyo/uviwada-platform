/* eslint-disable @next/next/no-img-element */
import styles from './pitch.module.css'
import { PitchNav } from './PitchNav'

const TOTAL_SLIDES = 13

export default function PitchPage() {
  return (
    <div className={styles.deck}>
      <PitchNav total={TOTAL_SLIDES} />

      {/* ============== 1. Cover ============== */}
      <section data-slide className={`${styles.slide} ${styles.cover}`}>
        <div className={styles.slideInner}>
          <p className={styles.coverEyebrow}>Practical Pitch &amp; Demonstration</p>
          <h1 className={styles.coverTitle}>
            UVIWADA Digital Platform
            <br />
            <span style={{ background: 'linear-gradient(135deg, #ff5961, #D42027)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              from inception to first phase
            </span>
          </h1>
          <p className={styles.coverSub}>
            A working four-layer platform — public website, member portal, M&amp;E dashboard, administrative
            backend — usable today, scalable to UVIWATA national and other regional associations tomorrow.
          </p>
          <div className={styles.coverMeta}>
            <div>
              Date
              <strong>Thursday, 30 April 2026</strong>
            </div>
            <div>
              Venue
              <strong>UVIWADA Office, Magomeni Mapipa</strong>
            </div>
            <div>
              Presented by
              <strong>7Square Group Limited</strong>
            </div>
          </div>
          <div className={styles.coverPartners}>
            <span>In partnership with</span>
            <img src="https://www.childrenincrossfire.org/wp-content/uploads/2022/08/CIC_logo_color_rgb-1-e1660224305433.png" alt="Children in Crossfire" />
          </div>
        </div>
      </section>

      {/* ============== 2. Where we are — the email ============== */}
      <section data-slide className={styles.slide}>
        <div className={styles.slideInner}>
          <span className={styles.eyebrow}>Where we are</span>
          <h2 className={styles.title}>From submission to shortlist to demonstration</h2>
          <div className={styles.grid2}>
            <div>
              <div className={styles.quote}>
                Thank you for your email and for submitting your proposal in response to the RFQ for Website
                Design, Development and Digital Platform Advisory Services for UVIWADA.
                <span className={styles.quoteCite}>
                  Heri Ayubu — Director of Performance and Operations, Children in Crossfire · 1 April 2026
                </span>
              </div>
              <div className={styles.quote}>
                Your firm has been shortlisted for the next stage of assessment and has been invited to a
                practical pitching and demonstration session before the panel.
                <span className={styles.quoteCite}>Heri Ayubu · 24 April 2026</span>
              </div>
            </div>
            <div>
              <div className={styles.card} style={{ background: 'rgba(212, 32, 39, 0.08)', borderColor: 'rgba(212, 32, 39, 0.3)' }}>
                <p className={styles.cardTitle}>Today we cover the four panel areas</p>
                <ol style={{ paddingLeft: '1.2rem', margin: 0, color: 'rgba(255,255,255,0.78)', lineHeight: 1.8, fontSize: '0.92rem' }}>
                  <li>Inception → first-phase delivery approach</li>
                  <li>Realistic and credible first-phase output</li>
                  <li>Practical examples that demonstrate technical capability</li>
                  <li>Architecture for UVIWATA national + UVIWADA regional + future regional bodies</li>
                </ol>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem' }}>
                  60 minutes · 40 demonstration · 20 Q&amp;A
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== 3. Who we are ============== */}
      <section data-slide className={styles.slide}>
        <div className={styles.slideInner}>
          <span className={styles.eyebrow}>Who we are</span>
          <h2 className={styles.title}>7Square Group Limited</h2>
          <p className={styles.lead}>
            A consultancy delivering data-driven digital infrastructure across East and Southern Africa — visa
            CRM platforms, community intelligence systems, compliance suites, and ward-level GIS tools. Tanzania
            and Zimbabwe-based delivery teams; clients across SADC, EU and donor agencies.
          </p>

          <div className={styles.grid3}>
            <div className={styles.card}>
              <span className={styles.cardNum}>01</span>
              <h3 className={styles.cardTitle}>Ernest Moyo</h3>
              <p className={styles.cardBody}>
                <strong style={{ color: '#fff' }}>Co-founder &amp; CEO</strong>
                <br />
                Actuarial Science · MSc Biostatistics &amp; Epidemiology. Business analyst,
                M&amp;E lead, NMECDP KPI mapping, CiC liaison.
              </p>
            </div>
            <div className={styles.card}>
              <span className={styles.cardNum}>02</span>
              <h3 className={styles.cardTitle}>Rodden Chikonzo</h3>
              <p className={styles.cardBody}>
                <strong style={{ color: '#fff' }}>Co-founder &amp; CTO</strong>
                <br />
                BSc Electronic Engineering · MSc Project Management. Technical lead,
                Next.js + Postgres + Leaflet, M&amp;E dashboard architecture.
              </p>
            </div>
            <div className={styles.card}>
              <span className={styles.cardNum}>03</span>
              <h3 className={styles.cardTitle}>Diligence Madzivo</h3>
              <p className={styles.cardBody}>
                <strong style={{ color: '#fff' }}>UX / UI Designer</strong>
                <br />
                Dar es Salaam-based. Mobile-first wireframes, accessibility, low-bandwidth design,
                bilingual layout, user testing in HDLI wards.
              </p>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '1.5rem' }}>
            <a href="https://www.7squareinc.com" target="_blank" rel="noreferrer" style={{ color: '#6daafd' }}>
              www.7squareinc.com
            </a>
            {' · ernest@7squareinc.com · +255 755 731 262'}
          </p>
        </div>
      </section>

      {/* ============== 4. Architecture ============== */}
      <section data-slide className={styles.slide}>
        <div className={styles.slideInner}>
          <span className={styles.eyebrow}>What we proposed</span>
          <h2 className={styles.title}>Four-layer platform architecture</h2>
          <p className={styles.lead}>
            One coherent system serving five distinct user groups — visitors, members, secretariat, CiC
            programme staff, and field assessors — built scalable-by-design for the national federation from
            day one.
          </p>

          <div className={styles.layers}>
            <div className={styles.layer}>
              <div className={styles.layerNum}>1</div>
              <div>
                <p className={styles.layerTitle}>Public-facing institutional website</p>
                <p className={styles.layerBody}>
                  Bilingual SW/EN home, About, Membership, News, Resources, public sector data page, member
                  directory, GIS map of all 102 Dar es Salaam wards.
                </p>
              </div>
            </div>
            <div className={styles.layer}>
              <div className={styles.layerNum}>2</div>
              <div>
                <p className={styles.layerTitle}>Member service portal — 7 modules behind login</p>
                <p className={styles.layerBody}>
                  Membership management · Quality improvement tracking (RAG traffic light) · Training &amp;
                  capacity development · Regulatory compliance &amp; licensing · Business viability support ·
                  Child welfare &amp; safeguarding · Communications &amp; coordination.
                </p>
              </div>
            </div>
            <div className={styles.layer}>
              <div className={styles.layerNum}>3</div>
              <div>
                <p className={styles.layerTitle}>Programme data &amp; M&amp;E dashboard</p>
                <p className={styles.layerBody}>
                  UVIWADA secretariat dashboard + CiC programme staff dashboard with NMECDP-aligned
                  indicators. One-click exports for Conrad N. Hilton Foundation donor reporting.
                </p>
              </div>
            </div>
            <div className={styles.layer}>
              <div className={styles.layerNum}>4</div>
              <div>
                <p className={styles.layerTitle}>Administrative backend</p>
                <p className={styles.layerBody}>
                  Non-technical CMS · member record administration · CSV / Excel exports · role and
                  permissions management.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.pillList}>
            <span className={styles.pill}>Mobile-first</span>
            <span className={styles.pill}>Bilingual SW / EN</span>
            <span className={styles.pill}>Low-bandwidth optimised</span>
            <span className={styles.pill}>WCAG accessible</span>
            <span className={styles.pill}>NMECDP-aligned</span>
            <span className={styles.pill}>Multi-tenant by design</span>
          </div>
        </div>
      </section>

      {/* ============== 5. Panel area 1 — Inception methodology ============== */}
      <section data-slide className={styles.slide}>
        <div className={styles.slideInner}>
          <span className={styles.eyebrow}>Panel area 1</span>
          <h2 className={styles.title}>Inception → first-phase delivery approach</h2>
          <p className={styles.lead}>
            We treat the inception phase as the engagement&apos;s foundation, not its overhead. By the end of
            week 3 every assumption in this deck is jointly validated and the MVP scope is signed off.
          </p>

          <div className={styles.flow}>
            <div className={styles.flowStep}>
              <div className={styles.flowNum}>Wk 1</div>
              <p className={styles.flowTitle}>Briefing &amp; alignment</p>
              <p className={styles.flowBody}>UVIWADA leadership + CiC programme staff workshop. NMECDP KPI mapping.</p>
            </div>
            <div className={styles.flowStep}>
              <div className={styles.flowNum}>Wk 2</div>
              <p className={styles.flowTitle}>Service mapping</p>
              <p className={styles.flowBody}>Document every service UVIWADA provides or intends to provide.</p>
            </div>
            <div className={styles.flowStep}>
              <div className={styles.flowNum}>Wk 2</div>
              <p className={styles.flowTitle}>HDLI user research</p>
              <p className={styles.flowBody}>6–8 daycare owners across Vingunguti, Manzese, Temeke.</p>
            </div>
            <div className={styles.flowStep}>
              <div className={styles.flowNum}>Wk 3</div>
              <p className={styles.flowTitle}>Domain &amp; hosting</p>
              <p className={styles.flowBody}>.or.tz domain, hosting environment, organisational email.</p>
            </div>
            <div className={styles.flowStep}>
              <div className={styles.flowNum}>Wk 3</div>
              <p className={styles.flowTitle}>Inception report</p>
              <p className={styles.flowBody}>Refined requirements, KPI map, agreed MVP scope, risk register.</p>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className={styles.stat}>
              <span className={styles.statValue}>3 wk</span>
              <span className={styles.statLabel}>Inception phase</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>10 wk</span>
              <span className={styles.statLabel}>Build to MVP</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>13 wk</span>
              <span className={styles.statLabel}>Sign-off to launch</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>Mid-Jun</span>
              <span className={styles.statLabel}>MVP live target</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============== 6. Panel area 2 — Realistic first-phase output ============== */}
      <section data-slide className={styles.slide}>
        <div className={styles.slideInner}>
          <span className={styles.liveBadge}>LIVE NOW · uviwada-platform.vercel.app</span>
          <span className={styles.eyebrow}>Panel area 2</span>
          <h2 className={styles.title}>A realistic and credible first-phase output</h2>
          <p className={styles.lead}>
            We did not bring slides describing the platform — we built a thin-but-real working version and
            shipped it to production. Every claim below is something a panellist can click on right now.
          </p>

          <div className={styles.grid3}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>✓ Public bilingual site</h3>
              <p className={styles.cardBody}>
                8 sections, language toggle, ward-level GIS map of 102 Dar wards, live KPI cards reading
                from Postgres.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>✓ Member portal &amp; auth</h3>
              <p className={styles.cardBody}>
                Centre registration, role-aware login, traffic-light dashboard, license countdown,
                self-register for trainings, recommended trainings from quality gaps.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>✓ Secretariat console</h3>
              <p className={styles.cardBody}>
                Members table with filters + CSV export, training CRUD, 30-item ECCE assessment form
                (GPS + photos), broadcast announcements.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>✓ Live M&amp;E dashboard</h3>
              <p className={styles.cardBody}>
                NMECDP-indicative KPIs, quality donut, membership growth, ward bar chart, CSV +
                Print-PDF export, dual UVIWADA / CiC views.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>✓ Field assessor PWA</h3>
              <p className={styles.cardBody}>
                Installable on Android, works fully offline (IndexedDB queue), syncs when network returns,
                GPS + photos to Supabase Storage.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>✓ Multi-tenant ready</h3>
              <p className={styles.cardBody}>
                Live tenant switcher: UVIWADA-DAR ↔ UVIWATA-NATIONAL ↔ UVIWAKI-KILIMANJARO. Same UI, scoped
                data per click.
              </p>
            </div>
          </div>

          <a href="https://uviwada-platform.vercel.app" target="_blank" rel="noreferrer" className={styles.cta}>
            Open the live platform →
          </a>
        </div>
      </section>

      {/* ============== 7. Panel area 3 — Practical demo ============== */}
      <section data-slide className={styles.slide}>
        <div className={styles.slideInner}>
          <span className={styles.eyebrow}>Panel area 3 — handoff to live demo</span>
          <h2 className={styles.title}>Three journeys, one platform</h2>
          <p className={styles.lead}>
            We will pause the deck here and switch to the browser. Each journey takes ~7 minutes; the
            whole demo block runs in 22 minutes leaving ample Q&amp;A time.
          </p>

          <div className={styles.grid3}>
            <div className={styles.card} style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
              <span className={styles.cardNum}>01</span>
              <h3 className={styles.cardTitle}>Member onboarding</h3>
              <p className={styles.cardBody}>
                Walk in as a daycare owner. Register the centre via a 9-field form. Land on the portal
                dashboard. See the centre on the map within 30 s.
              </p>
              <div className={styles.pillList}>
                <span className={styles.pill}>/portal/register</span>
                <span className={styles.pill}>/portal</span>
              </div>
            </div>
            <div className={styles.card} style={{ borderColor: 'rgba(43,122,212,0.3)' }}>
              <span className={styles.cardNum}>02</span>
              <h3 className={styles.cardTitle}>Secretariat &amp; live dashboard</h3>
              <p className={styles.cardBody}>
                Schedule a training. Record an assessment. Watch the donut chart, map marker and member
                portal traffic light update without page reload.
              </p>
              <div className={styles.pillList}>
                <span className={styles.pill}>/admin</span>
                <span className={styles.pill}>/dashboard</span>
              </div>
            </div>
            <div className={styles.card} style={{ borderColor: 'rgba(212,32,39,0.3)' }}>
              <span className={styles.cardNum}>03</span>
              <h3 className={styles.cardTitle}>Field assessor — APK moment</h3>
              <p className={styles.cardBody}>
                Install on phone. <strong style={{ color: '#ff8a90' }}>Enable airplane mode.</strong> Complete an assessment
                with photo + GPS. Toggle airplane mode off. Row appears in the secretariat console within 5 s.
              </p>
              <div className={styles.pillList}>
                <span className={styles.pill}>/assess</span>
                <span className={`${styles.pill} ${styles.red}`}>HDLI ready</span>
              </div>
            </div>
          </div>

          <a href="https://uviwada-platform.vercel.app/login" target="_blank" rel="noreferrer" className={styles.cta}>
            Sign in to start the demo →
          </a>
        </div>
      </section>

      {/* ============== 8. Panel area 4 — Multi-tenant ============== */}
      <section data-slide className={styles.slide}>
        <div className={styles.slideInner}>
          <span className={styles.eyebrow}>Panel area 4</span>
          <h2 className={styles.title}>National + regional + future regional bodies</h2>
          <p className={styles.lead}>
            Every domain row in the database carries an <code style={{ background: 'rgba(255,255,255,0.08)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>org_id</code> from day one.
            UVIWADA-DAR is the first node; UVIWATA-NATIONAL is the federation parent; UVIWAKI-KILIMANJARO
            is seeded as the proof that adding a new regional association is a two-row insert, not a
            re-architecture.
          </p>

          <div className={styles.tenantRow}>
            <div className={styles.tenantBox}>
              <div className={styles.tenantName}>UVIWADA-DAR</div>
              <div className={styles.tenantScope}>Regional · Dar es Salaam</div>
            </div>
            <div className={styles.tenantArrow}>↔</div>
            <div className={styles.tenantBox}>
              <div className={styles.tenantName}>UVIWATA-NATIONAL</div>
              <div className={styles.tenantScope}>National federation parent 🇹🇿</div>
            </div>
            <div className={styles.tenantArrow}>↔</div>
            <div className={styles.tenantBox}>
              <div className={styles.tenantName}>UVIWAKI-KILIMANJARO</div>
              <div className={styles.tenantScope}>Regional · Kilimanjaro</div>
            </div>
          </div>

          <div className={styles.grid3} style={{ marginTop: '2rem' }}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Three clicks, not three rebuilds</h3>
              <p className={styles.cardBody}>
                Switch tenant from the admin nav dropdown — KPIs, members table, training calendar and
                announcements all re-scope live. Same code, same UI, isolated data.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Data isolation by RLS</h3>
              <p className={styles.cardBody}>
                Postgres Row Level Security enforces visibility per role per tenant. A UVIWADA member never
                sees UVIWAKI data, even with a forged URL.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Onboarding new federations</h3>
              <p className={styles.cardBody}>
                Phase 2 work: a self-service federation onboarding wizard. Today the schema supports it; the
                UI to manage it is the next sprint.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== 9. Tech stack ============== */}
      <section data-slide className={styles.slide}>
        <div className={styles.slideInner}>
          <span className={styles.eyebrow}>How it&apos;s built</span>
          <h2 className={styles.title}>Stack we proposed, stack we shipped</h2>
          <p className={styles.lead}>
            The technical proposal named Next.js, Node, PostgreSQL and Leaflet. The live platform runs on
            exactly that — augmented with Supabase as the managed Postgres + Auth + Storage host, Capacitor
            for the Android wrapper, and a Service Worker for offline assessments.
          </p>

          <div className={styles.grid4}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Next.js 14</h3>
              <p className={styles.cardBody}>App Router, TypeScript, Tailwind. Public site + portal + admin + API in one codebase.</p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Supabase Postgres</h3>
              <p className={styles.cardBody}>Managed Postgres, Row Level Security, Storage for assessment photos, encrypted at rest.</p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Leaflet + Chart.js</h3>
              <p className={styles.cardBody}>Ward-level GIS map of 102 Dar es Salaam wards. Live donut, line, bar charts.</p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>PWA + Capacitor</h3>
              <p className={styles.cardBody}>Installable Android app from the same codebase. Offline assessments via IndexedDB queue + Background Sync.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== 10. Portfolio precedent ============== */}
      <section data-slide className={styles.slide}>
        <div className={styles.slideInner}>
          <span className={styles.eyebrow}>We have done this before</span>
          <h2 className={styles.title}>Strongest precedent — Six Rivers Tanzania</h2>
          <p className={styles.lead}>
            Six Rivers Community Intelligence Platform — a Tanzania-based platform with ward-level GIS,
            member registration and tracking, field data collection, impact dashboards with donor
            reporting, and offline-capable mobile design. The closest architectural parallel to UVIWADA
            across all four proposed layers.
          </p>

          <div className={styles.grid3}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Six Rivers Africa 🇹🇿</h3>
              <p className={styles.cardBody}>
                Community platform, ward-level GIS, field data collection, donor-reportable dashboards.
                Same four-layer pattern.
              </p>
              <p style={{ fontSize: '0.78rem', color: '#6daafd', marginTop: '0.5rem' }}>
                github.com/ernestmoyo/six_rivers_community
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>SADC Impact Risk Studio</h3>
              <p className={styles.cardBody}>
                Multi-stakeholder M&amp;E workspace for SADC DRR / UNDP / GIZ / WFP / AUC. KPI frameworks
                aligned to international reporting.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Wilson Compliance — NZ</h3>
              <p className={styles.cardBody}>
                30-item compliance checklists, certificate generation, training records with expiry —
                directly relevant to UVIWADA quality and certificates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== 11. Financials ============== */}
      <section data-slide className={styles.slide}>
        <div className={styles.slideInner}>
          <span className={styles.eyebrow}>What it costs</span>
          <h2 className={styles.title}>22,000,000 TZS · all-inclusive · 13 weeks</h2>
          <p className={styles.lead}>
            Fixed-price engagement broken down by component, as requested in the RFQ. No hidden costs,
            no per-hour billing, no scope creep on Phase 1.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '1.5rem 1.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.85rem 1.5rem', fontSize: '0.95rem', alignItems: 'baseline' }}>
              <strong style={{ color: '#fff' }}>1.</strong>
              <span>Inception &amp; requirements (3 weeks)</span>
              <strong style={{ color: '#6daafd', fontVariantNumeric: 'tabular-nums' }}>2,800,000</strong>

              <strong style={{ color: '#fff' }}>2.</strong>
              <span>Domain, hosting, organisational email</span>
              <strong style={{ color: '#6daafd', fontVariantNumeric: 'tabular-nums' }}>900,000</strong>

              <strong style={{ color: '#fff' }}>3.</strong>
              <span>Public website design &amp; development</span>
              <strong style={{ color: '#6daafd', fontVariantNumeric: 'tabular-nums' }}>4,500,000</strong>

              <strong style={{ color: '#fff' }}>4.</strong>
              <span>Member service portal</span>
              <strong style={{ color: '#6daafd', fontVariantNumeric: 'tabular-nums' }}>7,500,000</strong>

              <strong style={{ color: '#fff' }}>5.</strong>
              <span>M&amp;E dashboard &amp; GIS layer</span>
              <strong style={{ color: '#6daafd', fontVariantNumeric: 'tabular-nums' }}>3,500,000</strong>

              <strong style={{ color: '#fff' }}>6.</strong>
              <span>Administrative backend</span>
              <strong style={{ color: '#6daafd', fontVariantNumeric: 'tabular-nums' }}>1,200,000</strong>

              <strong style={{ color: '#fff' }}>7.</strong>
              <span>Review, refinement, handover</span>
              <strong style={{ color: '#6daafd', fontVariantNumeric: 'tabular-nums' }}>1,600,000</strong>

              <span style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '0.5rem 0' }} />

              <strong style={{ color: '#fff', fontSize: '1.05rem' }}>Total</strong>
              <span style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600 }}>Fixed price · 13 weeks · TZS</span>
              <strong style={{ color: '#ff8a90', fontSize: '1.4rem', fontVariantNumeric: 'tabular-nums' }}>22,000,000</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ============== 12. What we need ============== */}
      <section data-slide className={styles.slide}>
        <div className={styles.slideInner}>
          <span className={styles.eyebrow}>What we need from you</span>
          <h2 className={styles.title}>To start week 1 cleanly</h2>
          <div className={styles.grid2}>
            <div>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>From UVIWADA secretariat</h3>
                <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.78)' }}>
                  <li>Sign-off on inception start date</li>
                  <li>Access to current member records (CSV / Excel acceptable)</li>
                  <li>Secretariat point-of-contact for the workshop</li>
                  <li>Approval to register the .or.tz domain</li>
                </ul>
              </div>
            </div>
            <div>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>From CiC programme team</h3>
                <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.78)' }}>
                  <li>NMECDP indicator definitions / data dictionary</li>
                  <li>Dar Urban Daycare Baseline Report</li>
                  <li>Confirmation of Conrad N. Hilton donor reporting cadence</li>
                  <li>Programme staff for Week 1 alignment session</li>
                </ul>
              </div>
            </div>
          </div>

          <div className={styles.partnerBlock}>
            <img src="https://www.childrenincrossfire.org/wp-content/uploads/2022/08/CIC_logo_color_rgb-1-e1660224305433.png" alt="Children in Crossfire" />
            <div>
              <strong style={{ color: '#fff', display: 'block', marginBottom: '0.2rem' }}>Strategic Partnership</strong>
              Children in Crossfire (CiC) — Dar Urban ECCE Programme
            </div>
          </div>
        </div>
      </section>

      {/* ============== 13. Closing ============== */}
      <section data-slide className={`${styles.slide} ${styles.closing}`}>
        <div className={styles.slideInner}>
          <span className={styles.eyebrow}>Thank you</span>
          <h2 className={styles.title} style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Mtoto Kwanza — children first.
          </h2>
          <p className={styles.lead}>
            We&apos;re ready to start the inception phase the day after award. Questions, please.
          </p>

          <div className={styles.contactBlock}>
            <p className={styles.contactName}>Ernest Moyo</p>
            <p className={styles.contactRole}>Co-founder &amp; CEO · 7Square Group Limited</p>
            <p className={styles.contactRow}>
              ✉ <a href="mailto:ernest@7squareinc.com">ernest@7squareinc.com</a>
            </p>
            <p className={styles.contactRow}>📱 +255 755 731 262</p>
            <p className={styles.contactRow}>
              🌐 <a href="https://www.7squareinc.com" target="_blank" rel="noreferrer">www.7squareinc.com</a>
            </p>
            <p className={styles.contactRow} style={{ marginTop: '0.85rem' }}>
              Live demo:{' '}
              <a href="https://uviwada-platform.vercel.app" target="_blank" rel="noreferrer">
                uviwada-platform.vercel.app
              </a>
            </p>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="https://uviwada-platform.vercel.app" target="_blank" rel="noreferrer" className={styles.cta}>
              Open the platform
            </a>
            <a href="https://uviwada-platform.vercel.app/login" target="_blank" rel="noreferrer" className={`${styles.cta} ${styles.secondary}`}>
              Sign in as Secretariat
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
