'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { useI18n } from '@/lib/i18n'
import type { DirectoryCentre } from '@/lib/directory'
import type { RegionOption } from '@/lib/regions'
import { RubricMap } from '@/components/quality/RubricMap'

type SortKey = 'name' | 'tier' | 'enrolment'

const TIER_ORDER: Record<string, number> = { 'Level 4': 0, 'Level 3': 1, 'Level 2': 2, 'Level 1': 3, Pending: 4 }

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

interface Props {
  centres: DirectoryCentre[]
  regions: RegionOption[]
  councils: string[]
  ownerships: string[]
}

export function DirectoryExplorer({ centres, regions, councils, ownerships }: Props) {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  const [q, setQ] = useState('')
  const [region, setRegion] = useState('All')
  const [council, setCouncil] = useState('All')
  const [ward, setWard] = useState('All')
  const [ownership, setOwnership] = useState('All')
  const [tier, setTier] = useState('All')
  const [sort, setSort] = useState<SortKey>('name')
  const [view, setView] = useState<'list' | 'map'>('list')
  const [near, setNear] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)

  function findNearMe() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setNear({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false) },
      () => setLocating(false),
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // Councils available within the selected region (cascade).
  const councilOptions = useMemo(() => {
    const subset = region === 'All' ? centres : centres.filter((c) => c.region === region)
    const inRegion = Array.from(new Set(subset.map((c) => c.council).filter((x): x is string => !!x))).sort()
    return inRegion.length ? inRegion : councils
  }, [centres, region, councils])

  const wardOptions = useMemo(() => {
    let subset = region === 'All' ? centres : centres.filter((c) => c.region === region)
    if (council !== 'All') subset = subset.filter((c) => c.council === council)
    return Array.from(new Set(subset.map((c) => c.ward).filter((w): w is string => !!w))).sort()
  }, [centres, region, council])

  // A region selected from the "coming soon" set (no data yet).
  const regionComingSoon = region !== 'All' && !(regions.find((r) => r.value === region)?.live)

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const filtered = centres.filter((c) => {
      if (region !== 'All' && c.region !== region) return false
      if (council !== 'All' && c.council !== council) return false
      if (ward !== 'All' && c.ward !== ward) return false
      if (ownership !== 'All' && c.ownership !== ownership) return false
      if (tier !== 'All' && c.tierShort !== tier) return false
      if (needle) {
        const hay = `${c.name} ${c.council ?? ''} ${c.ward ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    const sorted = [...filtered]
    if (near) {
      // "Near me": nearest first; centres without coordinates sink to the bottom.
      sorted.sort((a, b) => {
        const da = a.lat != null && a.lng != null ? distanceKm(near, { lat: a.lat, lng: a.lng }) : Infinity
        const db = b.lat != null && b.lng != null ? distanceKm(near, { lat: b.lat, lng: b.lng }) : Infinity
        return da - db
      })
    } else if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'enrolment') sorted.sort((a, b) => (b.children ?? 0) - (a.children ?? 0))
    else sorted.sort((a, b) => (TIER_ORDER[a.tierShort] ?? 9) - (TIER_ORDER[b.tierShort] ?? 9) || a.name.localeCompare(b.name))
    return sorted
  }, [centres, q, region, council, ward, ownership, tier, sort, near])

  const mapPoints = useMemo(
    () =>
      results
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => ({ name: c.name, lat: c.lat as number, lng: c.lng as number, council: c.council, tier: c.tier, traffic: c.traffic })),
    [results]
  )

  return (
    <div>
      <div className="dir-controls">
        <input
          className="dir-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={sw ? 'Tafuta kwa jina au eneo…' : 'Search by name or area…'}
          aria-label={sw ? 'Tafuta kituo' : 'Search centres'}
        />
        <Select
          label={sw ? 'Mkoa' : 'Province/Region'}
          value={region}
          onChange={(v) => { setRegion(v); setCouncil('All'); setWard('All') }}
          options={['All', ...regions.map((r) => r.value)]}
          allLabel={sw ? 'Mikoa yote' : 'All regions'}
          labels={Object.fromEntries(regions.map((r) => [r.value, r.label]))}
        />
        <Select
          label={sw ? 'Halmashauri' : 'Council'}
          value={council}
          onChange={(v) => { setCouncil(v); setWard('All') }}
          options={['All', ...councilOptions]}
          allLabel={sw ? 'Zote' : 'All'}
        />
        <Select
          label={sw ? 'Kata' : 'Ward'}
          value={ward}
          onChange={setWard}
          options={['All', ...wardOptions]}
          allLabel={sw ? 'Zote' : 'All wards'}
        />
        <Select label={sw ? 'Umiliki' : 'Ownership'} value={ownership} onChange={setOwnership} options={['All', ...ownerships]} allLabel={sw ? 'Zote' : 'All'} />
        <Select label={sw ? 'Ngazi' : 'Tier'} value={tier} onChange={setTier} options={['All', 'Level 4', 'Level 3', 'Level 2', 'Level 1']} allLabel={sw ? 'Zote' : 'All'} />
        <Select
          label={sw ? 'Panga' : 'Sort'}
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={['name', 'tier', 'enrolment']}
          labels={{ name: sw ? 'Jina' : 'Name', tier: sw ? 'Ngazi ya ubora' : 'Quality tier', enrolment: sw ? 'Idadi ya watoto' : 'Enrolment' }}
        />
      </div>

      {regionComingSoon ? (
        <div className="u-card" style={{ padding: '2rem', textAlign: 'center', margin: '0.5rem 0 1rem', border: '1px dashed var(--border)' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-dark, #0F3D6E)' }}>
            {sw ? `${region}: takwimu zinakuja hivi karibuni` : `${region}: data coming soon`}
          </div>
          <p style={{ color: 'var(--muted)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            {sw
              ? 'Tathmini ya vituo katika mkoa huu bado haijaanza. Kwa sasa data ipo kwa Dar es Salaam.'
              : 'Centre assessments for this region are not live yet. Data is currently available for Dar es Salaam.'}
          </p>
        </div>
      ) : (
        <p className="dir-count">
          {sw ? 'Inaonyesha' : 'Showing'} <strong>{results.length}</strong> {sw ? 'kati ya' : 'of'} {centres.length} {sw ? 'vituo' : 'centres'}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', margin: '0 0 1rem' }}>
        <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {(['list', 'map'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              style={{
                padding: '0.4rem 0.95rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                background: view === v ? 'var(--primary, #1A5FAA)' : '#fff', color: view === v ? '#fff' : 'var(--muted)'
              }}
            >
              {v === 'list' ? (sw ? 'Orodha' : 'List') : (sw ? 'Ramani' : 'Map')}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={findNearMe}
          style={{
            padding: '0.4rem 0.95rem', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
            background: near ? 'var(--primary-light, #2B7AD4)' : '#fff', color: near ? '#fff' : 'var(--primary-dark, #0F3D6E)'
          }}
        >
          📍 {locating ? (sw ? 'Inatafuta…' : 'Locating…') : near ? (sw ? 'Karibu nawe ✓' : 'Near me ✓') : (sw ? 'Karibu nawe' : 'Near me')}
        </button>
        {near && (
          <button type="button" onClick={() => setNear(null)} style={{ background: 'none', border: 'none', color: 'var(--link, #2B7AD4)', cursor: 'pointer', fontSize: '0.82rem' }}>
            {sw ? 'Ondoa' : 'Clear'}
          </button>
        )}
      </div>

      {view === 'map' ? (
        mapPoints.length > 0 ? (
          <div className="u-card" style={{ overflow: 'hidden', marginBottom: '1rem' }}>
            <RubricMap points={mapPoints} />
          </div>
        ) : (
          <p className="dir-empty">{sw ? 'Hakuna vituo vyenye eneo la ramani.' : 'No centres with map coordinates to show.'}</p>
        )
      ) : (
        <div className="dir-grid">
          {results.map((c) => {
            const dist = near && c.lat != null && c.lng != null ? distanceKm(near, { lat: c.lat, lng: c.lng }) : null
            return (
              <Link key={c.slug} href={`/centre/${c.slug}`} className="dir-card">
                <div className="dir-card-top">
                  <span className={`dir-tier tier-${c.traffic}`}>{c.scored ? c.tierShort : sw ? 'Inasubiri' : 'Pending'}</span>
                  {c.ownership && <span className="dir-own">{c.ownership}</span>}
                </div>
                <h3>{c.name}</h3>
                <p className="dir-loc">📍 {c.ward ? `${c.ward}, ` : ''}{c.council ?? 'Dar es Salaam'}{dist != null ? ` · ${dist.toFixed(1)} km` : ''}</p>
                <div className="dir-meta">
                  {c.children != null && (
                    <span>{c.children} {sw ? 'watoto' : 'children'}</span>
                  )}
                  {c.careworkers != null && (
                    <span>{c.careworkers} {sw ? 'walezi' : 'staff'}</span>
                  )}
                </div>
                <span className="dir-view">{sw ? 'Tazama wasifu →' : 'View profile →'}</span>
              </Link>
            )
          })}
        </div>
      )}

      {view === 'list' && results.length === 0 && (
        <p className="dir-empty">{sw ? 'Hakuna vituo vinavyolingana na utafutaji wako.' : 'No centres match your search.'}</p>
      )}
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
  allLabel,
  labels
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  allLabel?: string
  labels?: Record<string, string>
}) {
  return (
    <label className="dir-select">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o === 'All' && allLabel ? allLabel : labels?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  )
}
