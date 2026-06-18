'use client'

import { useCallback, useEffect, useState } from 'react'
import { fmtDate } from '@/lib/format'

import { useI18n } from '@/lib/i18n'

interface Props {
  approverName: string
}

interface CertItem {
  id: string
  status: string
  cert_ref: string | null
  period_label: string | null
  requested_at: string
  approved_at: string | null
  centre_name: string
  ward: string | null
}

function fmt(iso: string | null): string {
  if (!iso) return ''
  try {
    return fmtDate(iso)
  } catch {
    return ''
  }
}

export function CertificateApprovals({ approverName: _approverName }: Props) {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [items, setItems] = useState<CertItem[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/certificates', { cache: 'no-store' })
    if (res.ok) {
      const j = (await res.json()) as { items?: CertItem[] }
      setItems(j.items ?? [])
    } else {
      setItems([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function approve(id: string) {
    setBusy(id)
    const res = await fetch('/api/admin/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.ok) await load()
    setBusy(null)
  }

  if (items === null) {
    return (
      <div className="mem-card">
        <p className="mem-note">{sw ? 'Inapakia…' : 'Loading…'}</p>
      </div>
    )
  }

  const pending = items.filter((r) => r.status === 'requested')
  const issued = items.filter((r) => r.status === 'issued')

  if (items.length === 0) {
    return (
      <div className="mem-card">
        <p className="mem-note">
          {sw
            ? 'Hakuna maombi ya vyeti bado. Yataonekana hapa baada ya Sekretarieti kurekodi malipo yaliyothibitishwa.'
            : 'No certificate requests yet. They appear here once the secretariat records a verified payment.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <div className="mem-card">
        <div className="mem-card-head">
          <h3>{sw ? `Yanayosubiri idhini (${pending.length})` : `Awaiting approval (${pending.length})`}</h3>
        </div>
        {pending.length === 0 ? (
          <p className="mem-note">{sw ? 'Hakuna yanayosubiri.' : 'Nothing pending.'}</p>
        ) : (
          <div className="mem-table">
            <div className="mem-trow mem-thead cert-approve-row">
              <span>{sw ? 'Kituo' : 'Centre'}</span>
              <span>{sw ? 'Kipindi' : 'Period'}</span>
              <span>{sw ? 'Imeombwa' : 'Requested'}</span>
              <span />
            </div>
            {pending.map((r) => (
              <div className="mem-trow cert-approve-row" key={r.id}>
                <span>
                  <strong>{r.centre_name}</strong>
                  {r.ward ? <span style={{ color: 'var(--muted)' }}> · {r.ward}</span> : null}
                </span>
                <span>{r.period_label ?? '—'}</span>
                <span>{fmt(r.requested_at)}</span>
                <span style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                    disabled={busy === r.id}
                    onClick={() => approve(r.id)}
                  >
                    {busy === r.id ? (sw ? 'Inatoa…' : 'Issuing…') : sw ? 'Idhinisha & toa' : 'Approve & issue'}
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {issued.length > 0 && (
        <div className="mem-card">
          <div className="mem-card-head">
            <h3>{sw ? `Vilivyotolewa (${issued.length})` : `Issued (${issued.length})`}</h3>
          </div>
          <div className="mem-table">
            {issued.map((r) => (
              <div className="mem-trow cert-approve-row" key={r.id}>
                <span><strong>{r.centre_name}</strong></span>
                <span>{r.cert_ref}</span>
                <span>{fmt(r.approved_at)}</span>
                <span style={{ textAlign: 'right', color: '#166534', fontWeight: 600 }}>{sw ? '✓ Imetolewa' : '✓ Issued'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
