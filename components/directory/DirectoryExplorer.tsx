'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { useI18n } from '@/lib/i18n'
import type { DirectoryCentre } from '@/lib/directory'

type SortKey = 'name' | 'tier' | 'enrolment'

const TIER_ORDER: Record<string, number> = { 'Level 4': 0, 'Level 3': 1, 'Level 2': 2, Pending: 3 }

interface Props {
  centres: DirectoryCentre[]
  councils: string[]
  ownerships: string[]
}

export function DirectoryExplorer({ centres, councils, ownerships }: Props) {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  const [q, setQ] = useState('')
  const [council, setCouncil] = useState('All')
  const [ownership, setOwnership] = useState('All')
  const [tier, setTier] = useState('All')
  const [sort, setSort] = useState<SortKey>('name')

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const filtered = centres.filter((c) => {
      if (council !== 'All' && c.council !== council) return false
      if (ownership !== 'All' && c.ownership !== ownership) return false
      if (tier !== 'All' && c.tierShort !== tier) return false
      if (needle) {
        const hay = `${c.name} ${c.council ?? ''} ${c.ward ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    const sorted = [...filtered]
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'enrolment') sorted.sort((a, b) => (b.children ?? 0) - (a.children ?? 0))
    else sorted.sort((a, b) => (TIER_ORDER[a.tierShort] ?? 9) - (TIER_ORDER[b.tierShort] ?? 9) || a.name.localeCompare(b.name))
    return sorted
  }, [centres, q, council, ownership, tier, sort])

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
        <Select label={sw ? 'Halmashauri' : 'Council'} value={council} onChange={setCouncil} options={['All', ...councils]} allLabel={sw ? 'Zote' : 'All'} />
        <Select label={sw ? 'Umiliki' : 'Ownership'} value={ownership} onChange={setOwnership} options={['All', ...ownerships]} allLabel={sw ? 'Zote' : 'All'} />
        <Select label={sw ? 'Ngazi' : 'Tier'} value={tier} onChange={setTier} options={['All', 'Level 4', 'Level 3', 'Level 2']} allLabel={sw ? 'Zote' : 'All'} />
        <Select
          label={sw ? 'Panga' : 'Sort'}
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={['name', 'tier', 'enrolment']}
          labels={{ name: sw ? 'Jina' : 'Name', tier: sw ? 'Ngazi ya ubora' : 'Quality tier', enrolment: sw ? 'Idadi ya watoto' : 'Enrolment' }}
        />
      </div>

      <p className="dir-count">
        {sw ? 'Inaonyesha' : 'Showing'} <strong>{results.length}</strong> {sw ? 'kati ya' : 'of'} {centres.length} {sw ? 'vituo' : 'centres'}
      </p>

      <div className="dir-grid">
        {results.map((c) => (
          <Link key={c.slug} href={`/centre/${c.slug}`} className="dir-card">
            <div className="dir-card-top">
              <span className={`dir-tier tier-${c.traffic}`}>{c.scored ? c.tierShort : sw ? 'Inasubiri' : 'Pending'}</span>
              {c.ownership && <span className="dir-own">{c.ownership}</span>}
            </div>
            <h3>{c.name}</h3>
            <p className="dir-loc">📍 {c.ward ? `${c.ward}, ` : ''}{c.council ?? 'Dar es Salaam'}</p>
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
        ))}
      </div>

      {results.length === 0 && (
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
