'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'

import { useI18n } from '@/lib/i18n'
import type { DirectoryCentre } from '@/lib/directory'
import { INFRA_SUBDOMAINS } from '@/lib/rubric'
import { tierMeaning } from '@/lib/sector'

const CentreAreaMap = dynamic(() => import('./CentreAreaMap').then((m) => m.CentreAreaMap), {
  ssr: false,
  loading: () => <div style={{ height: 280, borderRadius: 12, background: '#eef2f7' }} />
})

const TRAFFIC = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' }

export function CentreProfile({ centre: c, verifiedDate }: { centre: DirectoryCentre; verifiedDate: string | null }) {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  const infraRows = INFRA_SUBDOMAINS.map((d) => ({ label: sw ? d.sw : d.en, value: c.infra?.[d.key] ?? null })).filter(
    (r) => r.value != null
  )
  const strengths = [...infraRows].sort((a, b) => (b.value as number) - (a.value as number)).slice(0, 3)
  const improve = [...infraRows].sort((a, b) => (a.value as number) - (b.value as number)).slice(0, 3)

  const directionsHref = c.lat != null && c.lng != null ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}` : null

  return (
    <main style={{ background: 'var(--bg-alt)', minHeight: '100vh' }}>
      <header style={{ background: 'var(--primary-dark)', color: '#fff', padding: '1.1rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/directory" style={{ color: '#fff', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.4)', padding: '0.4rem 0.85rem', borderRadius: 8 }}>
            ← {sw ? 'Orodha' : 'Directory'}
          </Link>
          <Link href="/" style={{ color: '#fff', fontSize: '0.85rem', opacity: 0.85 }}>
            UVIWATA
          </Link>
        </div>
      </header>

      <section style={{ padding: '1.75rem 0 3rem' }}>
        <div className="container" style={{ maxWidth: 920 }}>
          {/* Title block */}
          <div className="prof-head">
            <div className="prof-badges">
              <span className="prof-badge prof-verified">✓ {sw ? 'Imetathminiwa na UVIWATA' : 'Assessed by UVIWATA'}</span>
              {c.scored && (
                <span className="prof-badge" style={{ background: TRAFFIC[c.traffic], color: '#fff' }}>
                  {c.tierShort}
                </span>
              )}
              {c.ownership && <span className="prof-badge prof-soft">{c.ownership}</span>}
            </div>
            <h1>{c.name}</h1>
            <p className="prof-loc">📍 {c.ward ? `${c.ward}, ` : ''}{c.council ?? 'Dar es Salaam'} · {sw ? 'Mwanachama wa UVIWADA' : 'UVIWADA regional member'}</p>
          </div>

          {/* Consent disclaimer */}
          <div className="dir-disclaimer" style={{ marginTop: '1rem' }}>
            <strong>{sw ? 'Taarifa za awali.' : 'Preliminary information.'}</strong>{' '}
            {sw
              ? 'Hii ni rekodi ya tathmini ya uwandani, si orodha ya umma iliyoidhinishwa. Mawasiliano na picha havijachapishwa; eneo ni la makadirio. Wazazi wanapaswa kufanya uchunguzi wao wenyewe.'
              : 'This is a field-assessment record, not a consented public listing. Contact details and photos are not published, and the location is approximate. Parents should make their own enquiries before enrolling a child.'}
          </div>

          {/* Quality summary */}
          <div className="prof-grid">
            <div className="prof-card">
              <h3>{sw ? 'Muhtasari wa ubora' : 'Quality summary'}</h3>
              <div className="prof-stats">
                <Stat label={sw ? 'Ngazi ya ubora' : 'Quality tier'} value={c.scored ? c.tierShort : sw ? 'Inasubiri' : 'Pending'} />
                <Stat label={sw ? 'Alama ya miundombinu' : 'Infrastructure score'} value={c.infraScore == null ? '—' : `${c.infraScore}/100`} />
                <Stat label={sw ? 'Uwezo wa walezi' : 'Careworker capacity'} value={c.capacityScore == null ? '—' : `${c.capacityScore}/100`} />
              </div>
              <p className="prof-tier-meaning">
                <strong>{tierMeaning(c.tierShort, sw).title}.</strong> {tierMeaning(c.tierShort, sw).note}
              </p>
              {!c.scored && (
                <p className="prof-note">
                  {sw
                    ? 'Alama kamili ya miundombinu bado inasubiri; ngazi haijathibitishwa.'
                    : 'Full infrastructure composite still pending; tier not yet confirmed.'}
                </p>
              )}
            </div>

            <div className="prof-card">
              <h3>{sw ? 'Kwa muhtasari' : 'At a glance'}</h3>
              <div className="prof-stats">
                <Stat label={sw ? 'Watoto' : 'Children'} value={c.children == null ? '—' : String(c.children)} />
                <Stat label={sw ? 'Wasichana / Wavulana' : 'Girls / Boys'} value={`${c.girls ?? '—'} / ${c.boys ?? '—'}`} />
                <Stat label={sw ? 'Walezi' : 'Careworkers'} value={c.careworkers == null ? '—' : String(c.careworkers)} />
                <Stat label={sw ? 'Watoto wenye ulemavu' : 'Children with disabilities'} value={c.disability == null ? '—' : String(c.disability)} />
                <Stat label={sw ? 'Ada (TZS/mwezi)' : 'Fee (TZS/month)'} value={c.monthlyFee == null ? '—' : c.monthlyFee.toLocaleString()} />
                <Stat
                  label={sw ? 'Usajili (binafsi)' : 'Registration (self-reported)'}
                  value={c.registration ? shorten(c.registration) : '—'}
                />
              </div>
            </div>
          </div>

          {/* Strengths / improvement */}
          {infraRows.length > 0 && (
            <div className="prof-grid">
              <div className="prof-card">
                <h3>{sw ? 'Nguvu kuu' : 'Top strengths'}</h3>
                {strengths.map((r) => (
                  <ProfBar key={r.label} label={r.label} value={r.value as number} />
                ))}
              </div>
              <div className="prof-card">
                <h3>{sw ? 'Maeneo ya kuboresha' : 'Areas to improve'}</h3>
                {improve.map((r) => (
                  <ProfBar key={r.label} label={r.label} value={r.value as number} />
                ))}
                {/* Pathway callout — only for scored Level 2 and Level 3 centres */}
                {c.scored && (c.tierShort === 'Level 2' || c.tierShort === 'Level 3') && (
                  <PathwayCallout
                    tierShort={c.tierShort}
                    improveLabels={improve.map((r) => r.label)}
                    sw={sw}
                  />
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {c.lat != null && c.lng != null && (
            <div className="prof-card" style={{ marginTop: '1rem' }}>
              <h3>{sw ? 'Eneo (la makadirio)' : 'Location (approximate)'}</h3>
              <CentreAreaMap lat={c.lat} lng={c.lng} label={c.name} />
              {directionsHref && (
                <a className="btn btn-outline" href={directionsHref} target="_blank" rel="noopener noreferrer" style={{ marginTop: '0.9rem', display: 'inline-block' }}>
                  {sw ? 'Pata maelekezo →' : 'Get directions →'}
                </a>
              )}
            </div>
          )}

          {/* Footer note + claim CTA */}
          <div className="prof-claim">
            <div>
              <strong>{sw ? 'Je, hiki ni kituo chako?' : 'Is this your centre?'}</strong>
              <p>
                {sw
                  ? 'Jiunge na UVIWATA ili kudhibiti wasifu wako wa umma, kuongeza picha na mawasiliano, na kupata utambulisho uliothibitishwa.'
                  : 'Join UVIWATA to claim your public profile, add photos and contact details, and get a verified identity.'}
              </p>
            </div>
            <Link href="/portal/register" className="btn btn-primary">
              {sw ? 'Jiunge / Dai wasifu' : 'Join / Claim profile'}
            </Link>
          </div>

          {verifiedDate && (
            <p className="prof-verified-date">
              {sw ? 'Ilitathminiwa: ' : 'Last assessed: '}
              {verifiedDate}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="prof-stat">
      <span className="prof-stat-label">{label}</span>
      <span className="prof-stat-value">{value}</span>
    </div>
  )
}

function ProfBar({ label, value }: { label: string; value: number }) {
  const w = Math.max(4, Math.min(100, (value / 4) * 100))
  const color = value < 2 ? TRAFFIC.red : value < 2.5 ? TRAFFIC.amber : TRAFFIC.green
  return (
    <div className="dash-bar dense">
      <div className="dash-bar-head">
        <span>{label}</span>
        <strong>{value.toFixed(1)}/4</strong>
      </div>
      <div className="dash-bar-track">
        <div className="dash-bar-fill" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  )
}

function shorten(s: string) {
  return s.length > 26 ? s.slice(0, 25) + '…' : s
}

function PathwayCallout({
  tierShort,
  improveLabels,
  sw,
}: {
  tierShort: 'Level 2' | 'Level 3'
  improveLabels: string[]
  sw: boolean
}) {
  const nextTier = tierShort === 'Level 2' ? 'Level 3' : 'Level 4'
  const areas = improveLabels.join(', ')

  return (
    <div className="prof-pathway">
      <span className="prof-pathway-tag">
        {sw ? 'Njia ya kupanda ngazi' : 'Pathway to next tier'}
      </span>
      <p>
        {sw ? (
          <>
            <strong>Njia ya {nextTier}:</strong> Lenga maeneo ya kipaumbele hapa chini —{' '}
            <strong>{areas}</strong>. Kila hatua ya maboresho inakukaribisha karibu zaidi na
            {' '}{nextTier}.
          </>
        ) : (
          <>
            <strong>Pathway to {nextTier}:</strong> Focus on the priority areas below —{' '}
            <strong>{areas}</strong>. Each improvement step brings this centre closer to{' '}
            {nextTier}.
          </>
        )}
      </p>
    </div>
  )
}
