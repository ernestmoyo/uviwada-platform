'use client'

import { useMemo, useState } from 'react'

import type { AdminMember } from '@/lib/admin-data'
import type { LicenseStatus, QualityRating } from '@/lib/types/database'

export interface MembersTableInitialFilters {
  q?: string
  ward?: string
  district?: string
  quality?: string
  license?: string
}

interface MembersTableProps {
  members: AdminMember[]
  readOnly?: boolean
  initialFilters?: MembersTableInitialFilters
}

const QUALITY_OPTIONS: Array<QualityRating | 'all'> = ['all', 'green', 'amber', 'red']
const LICENSE_OPTIONS: Array<LicenseStatus | 'all'> = ['all', 'fully_licensed', 'pending', 'not_applied', 'expired']

export function MembersTable({ members, readOnly = false, initialFilters = {} }: MembersTableProps) {
  const [search, setSearch] = useState(initialFilters.q ?? '')
  const [ward, setWard] = useState(initialFilters.ward ?? 'all')
  const [district, setDistrict] = useState(initialFilters.district ?? 'all')
  const [quality, setQuality] = useState<string>(initialFilters.quality ?? 'all')
  const [license, setLicense] = useState<string>(initialFilters.license ?? 'all')

  const wards = useMemo(() => Array.from(new Set(members.map((m) => m.ward))).sort(), [members])
  const districts = useMemo(() => Array.from(new Set(members.map((m) => m.district))).sort(), [members])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return members.filter((m) => {
      if (needle) {
        const haystack = `${m.centre_name} ${m.ward} ${m.district}`.toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      if (ward !== 'all' && m.ward !== ward) return false
      if (district !== 'all' && m.district !== district) return false
      if (quality !== 'all' && (m.latest_quality ?? '') !== quality) return false
      if (license !== 'all' && m.license_status !== license) return false
      return true
    })
  }, [members, search, ward, district, quality, license])

  const activeFilters = (search ? 1 : 0) + (ward !== 'all' ? 1 : 0) + (district !== 'all' ? 1 : 0) + (quality !== 'all' ? 1 : 0) + (license !== 'all' ? 1 : 0)

  function clearAll() {
    setSearch('')
    setWard('all')
    setDistrict('all')
    setQuality('all')
    setLicense('all')
  }

  function exportCsv() {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (ward !== 'all') params.set('ward', ward)
    if (district !== 'all') params.set('district', district)
    if (quality !== 'all') params.set('quality', quality)
    if (license !== 'all') params.set('license', license)
    window.location.href = `/api/members/export?${params.toString()}`
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}
      >
        <input
          placeholder="Search name, ward, district…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '0.5rem 0.7rem', border: '1px solid var(--border)', borderRadius: 8 }}
        />
        <select value={district} onChange={(e) => setDistrict(e.target.value)} style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border)' }}>
          <option value="all">All districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select value={ward} onChange={(e) => setWard(e.target.value)} style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border)' }}>
          <option value="all">All wards</option>
          {wards.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <select value={quality} onChange={(e) => setQuality(e.target.value)} style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border)' }}>
          {QUALITY_OPTIONS.map((q) => (
            <option key={q} value={q}>
              {q === 'all' ? 'All quality' : q}
            </option>
          ))}
        </select>
        <select value={license} onChange={(e) => setLicense(e.target.value)} style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border)' }}>
          {LICENSE_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l === 'all' ? 'All licences' : l.replace('_', ' ')}
            </option>
          ))}
        </select>
        {!readOnly && (
          <button
            onClick={exportCsv}
            className="btn"
            style={{ background: 'var(--primary)', color: '#fff', padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
          >
            Export CSV ({filtered.length})
          </button>
        )}
        {readOnly && (
          <div
            style={{
              alignSelf: 'center',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--muted)',
              textAlign: 'right'
            }}
          >
            Read-only · {filtered.length} centres
          </div>
        )}
      </div>

      {activeFilters > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem',
            fontSize: '0.82rem',
            color: 'var(--muted)'
          }}
        >
          <span>
            Showing <strong style={{ color: 'var(--primary-dark)' }}>{filtered.length}</strong> of {members.length} centres
          </span>
          <button
            onClick={clearAll}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '0.2rem 0.7rem',
              fontSize: '0.78rem',
              cursor: 'pointer',
              color: 'var(--primary-dark)'
            }}
          >
            Clear filters ({activeFilters})
          </button>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-alt)', textAlign: 'left' }}>
              <th style={th}>Centre</th>
              <th style={th}>Ward</th>
              <th style={th}>District</th>
              <th style={th}>Children</th>
              <th style={th}>Quality</th>
              <th style={th}>License</th>
              <th style={th}>Expiry</th>
              <th style={th}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  No members match the current filters.
                </td>
              </tr>
            )}
            {filtered.map((m) => (
              <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={td}>
                  <strong>{m.centre_name}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{m.phone}</div>
                </td>
                <td style={td}>{m.ward}</td>
                <td style={td}>{m.district}</td>
                <td style={{ ...td, textAlign: 'right' }}>{m.children_count}</td>
                <td style={td}>{qualityPill(m.latest_quality)}</td>
                <td style={td}>{licensePill(m.license_status)}</td>
                <td style={td}>{m.license_expiry ? new Date(m.license_expiry).toLocaleDateString() : '—'}</td>
                <td style={td}>{new Date(m.joined_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

const th: React.CSSProperties = {
  padding: '0.7rem 0.85rem',
  fontWeight: 600,
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--muted)'
}
const td: React.CSSProperties = { padding: '0.65rem 0.85rem', verticalAlign: 'top' }

function qualityPill(q: QualityRating | null) {
  if (!q) return <span style={{ color: 'var(--muted)' }}>—</span>
  const colours: Record<QualityRating, string> = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' }
  return (
    <span style={pill(colours[q])}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: colours[q], display: 'inline-block' }} />
      {q}
    </span>
  )
}

function licensePill(s: LicenseStatus) {
  const colours: Record<LicenseStatus, string> = {
    fully_licensed: '#22c55e',
    pending: '#f59e0b',
    not_applied: '#94a3b8',
    expired: '#ef4444'
  }
  return <span style={pill(colours[s])}>{s.replace('_', ' ')}</span>
}

function pill(colour: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '0.18rem 0.55rem',
    borderRadius: 999,
    fontSize: '0.75rem',
    fontWeight: 600,
    background: `${colour}1a`,
    color: colour
  }
}
