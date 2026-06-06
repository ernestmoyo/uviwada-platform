'use client'

import { useEffect, useState } from 'react'

import { useI18n } from '@/lib/i18n'
import { approveCertificate, formatDate, formatTZS, isActive, latestPayment, listAll, onChange, type MembershipRecord } from '@/lib/membership'

interface Props {
  approverName: string
}

export function CertificateApprovals({ approverName }: Props) {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [records, setRecords] = useState<MembershipRecord[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setRecords(listAll())
    setReady(true)
    return onChange(() => setRecords(listAll()))
  }, [])

  if (!ready) return null

  const pending = records.filter((r) => r.certStatus === 'requested')
  const issued = records.filter((r) => r.certStatus === 'issued')

  function approve(memberId: string) {
    approveCertificate(memberId, approverName)
    setRecords(listAll())
  }

  if (records.length === 0) {
    return (
      <div className="mem-card">
        <p className="mem-note">
          {sw
            ? 'Hakuna maombi ya vyeti bado. Maombi yataonekana hapa baada ya mwanachama kulipa ada (kwenye kifaa hiki).'
            : 'No certificate requests yet. Requests appear here once a member pays their fee (on this device).'}
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
              <span>{sw ? 'Namba ya cheti' : 'Certificate no.'}</span>
              <span>{sw ? 'Hali ya malipo' : 'Payment'}</span>
              <span />
            </div>
            {pending.map((r) => {
              const p = latestPayment(r)
              return (
                <div className="mem-trow cert-approve-row" key={r.memberId}>
                  <span><strong>{r.centreName}</strong></span>
                  <span>{r.certRef}</span>
                  <span>
                    {p ? `${formatTZS(p.amount)} TZS · ${formatDate(p.date)}` : '—'}
                    {isActive(r) ? '' : sw ? ' (imeisha)' : ' (expired)'}
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }} onClick={() => approve(r.memberId)}>
                      {sw ? 'Idhinisha & toa' : 'Approve & issue'}
                    </button>
                  </span>
                </div>
              )
            })}
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
              <div className="mem-trow cert-approve-row" key={r.memberId}>
                <span><strong>{r.centreName}</strong></span>
                <span>{r.certRef}</span>
                <span>{r.certApprovedDate ? formatDate(r.certApprovedDate) : ''}</span>
                <span style={{ textAlign: 'right', color: '#166534', fontWeight: 600 }}>{sw ? '✓ Imetolewa' : '✓ Issued'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
