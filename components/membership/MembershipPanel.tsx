'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useI18n } from '@/lib/i18n'
import {
  MEMBERSHIP_FEE_TZS,
  PAYMENT_METHODS,
  type MembershipRecord,
  type PaymentMethod,
  formatDate,
  formatTZS,
  isActive,
  latestPayment,
  load,
  onChange,
  recordPayment
} from '@/lib/membership'

interface Props {
  memberId: string
  centreName: string
}

export function MembershipPanel({ memberId, centreName }: Props) {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  const [record, setRecord] = useState<MembershipRecord | null>(null)
  const [showPay, setShowPay] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>('M-Pesa')
  const [paying, setPaying] = useState(false)
  const [justPaid, setJustPaid] = useState(false)

  useEffect(() => {
    setRecord(load(memberId, centreName))
    return onChange(() => setRecord(load(memberId, centreName)))
  }, [memberId, centreName])

  if (!record) return null
  const active = isActive(record)
  const latest = latestPayment(record)

  function pay() {
    setPaying(true)
    // simulate a mobile-money / bank round-trip
    window.setTimeout(() => {
      const next = recordPayment(memberId, centreName, method)
      setRecord(next)
      setPaying(false)
      setShowPay(false)
      setJustPaid(true)
    }, 1100)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
      {/* Membership status + payment */}
      <div className="mem-card">
        <div className="mem-card-head">
          <h3>{sw ? 'Uanachama' : 'Membership'}</h3>
          <span className={`mem-pill ${active ? 'mem-pill-active' : 'mem-pill-due'}`}>
            {active ? (sw ? 'Hai · Imelipwa' : 'Active · Paid') : sw ? 'Inasubiri malipo' : 'Payment due'}
          </span>
        </div>

        <div className="mem-fee">
          <span className="mem-fee-num">{formatTZS(MEMBERSHIP_FEE_TZS)}</span>
          <span className="mem-fee-unit">TZS / {sw ? 'mwaka' : 'year'}</span>
        </div>

        {latest ? (
          <div className="mem-rows">
            <Row label={sw ? 'Imelipwa' : 'Last paid'} value={formatDate(latest.date)} />
            <Row label={sw ? 'Kipindi' : 'Period'} value={`${formatDate(latest.periodFrom)} → ${formatDate(latest.periodTo)}`} />
            <Row label={sw ? 'Inaisha' : 'Expires'} value={formatDate(latest.periodTo)} />
            <Row label={sw ? 'Njia' : 'Method'} value={latest.method} />
          </div>
        ) : (
          <p className="mem-note">
            {sw ? 'Hujalipia ada ya uanachama mwaka huu.' : 'No membership fee recorded for this year yet.'}
          </p>
        )}

        <div className="mem-actions">
          <button className="btn btn-primary" onClick={() => { setShowPay(true); setJustPaid(false) }}>
            {active ? (sw ? 'Lipia upya' : 'Renew membership') : sw ? 'Lipa ada sasa' : 'Pay membership'}
          </button>
          {latest && (
            <Link className="btn btn-outline" href="/portal/receipt">
              {sw ? 'Risiti ya hivi karibuni' : 'Latest receipt'}
            </Link>
          )}
        </div>

        {justPaid && (
          <div className="mem-success">
            ✓ {sw ? 'Malipo yamekamilika. Risiti imetolewa.' : 'Payment complete. Receipt issued.'}{' '}
            <Link href="/portal/receipt">{sw ? 'Tazama risiti' : 'View receipt'}</Link>
          </div>
        )}
      </div>

      {/* Certificate */}
      <div className="mem-card">
        <div className="mem-card-head">
          <h3>{sw ? 'Cheti cha Uanachama' : 'Membership Certificate'}</h3>
          <span className={`mem-pill ${record.certStatus === 'issued' ? 'mem-pill-active' : record.certStatus === 'requested' ? 'mem-pill-due' : 'mem-pill-none'}`}>
            {record.certStatus === 'issued'
              ? sw ? 'Imetolewa' : 'Issued'
              : record.certStatus === 'requested'
                ? sw ? 'Inasubiri idhini' : 'Awaiting approval'
                : sw ? 'Bado' : 'Not requested'}
          </span>
        </div>

        {record.certStatus === 'none' && (
          <p className="mem-note">
            {sw
              ? 'Lipia ada ya uanachama ili kuomba cheti chako cha uanachama kilichoidhinishwa na UVIWATA.'
              : 'Pay your membership fee to request your UVIWATA-issued membership certificate.'}
          </p>
        )}
        {record.certStatus === 'requested' && (
          <p className="mem-note">
            {sw
              ? 'Ombi lako limepokelewa. Cheti kitapatikana mara baada ya Sekretarieti kuidhinisha.'
              : 'Your request has been received. The certificate becomes available once the Secretariat approves it.'}
          </p>
        )}
        {record.certStatus === 'issued' && (
          <>
            <div className="mem-rows">
              <Row label={sw ? 'Namba ya cheti' : 'Certificate no.'} value={record.certRef ?? '—'} />
              <Row label={sw ? 'Imeidhinishwa na' : 'Approved by'} value={record.certApprovedBy ?? 'UVIWATA Secretariat'} />
              {record.certApprovedDate && <Row label={sw ? 'Tarehe' : 'Date'} value={formatDate(record.certApprovedDate)} />}
            </div>
            <div className="mem-actions">
              <Link className="btn btn-primary" href="/portal/certificate">
                {sw ? 'Pakua cheti (PDF)' : 'Download certificate (PDF)'}
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Payment history */}
      {record.payments.length > 0 && (
        <div className="mem-card" style={{ gridColumn: '1 / -1' }}>
          <div className="mem-card-head">
            <h3>{sw ? 'Historia ya malipo' : 'Payment history'}</h3>
          </div>
          <div className="mem-table">
            <div className="mem-trow mem-thead">
              <span>{sw ? 'Tarehe' : 'Date'}</span>
              <span>{sw ? 'Namba' : 'Reference'}</span>
              <span>{sw ? 'Njia' : 'Method'}</span>
              <span>{sw ? 'Kiasi' : 'Amount'}</span>
            </div>
            {[...record.payments].reverse().map((p) => (
              <div className="mem-trow" key={p.ref}>
                <span>{formatDate(p.date)}</span>
                <span>{p.ref}</span>
                <span>{p.method}</span>
                <span>{formatTZS(p.amount)} TZS</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay modal */}
      {showPay && (
        <div className="mem-modal-backdrop" onClick={() => !paying && setShowPay(false)}>
          <div className="mem-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{sw ? 'Lipa ada ya uanachama' : 'Pay membership fee'}</h3>
            <p className="mem-modal-amount">
              {formatTZS(MEMBERSHIP_FEE_TZS)} TZS · {sw ? 'mwaka 1' : '1 year'}
            </p>
            <label className="mem-modal-label">{sw ? 'Chagua njia ya malipo' : 'Choose payment method'}</label>
            <div className="mem-methods">
              {PAYMENT_METHODS.map((m) => (
                <button key={m} className={`mem-method ${method === m ? 'active' : ''}`} onClick={() => setMethod(m)} disabled={paying}>
                  {m}
                </button>
              ))}
            </div>
            <div className="mem-actions" style={{ marginTop: '1.1rem' }}>
              <button className="btn btn-primary" onClick={pay} disabled={paying}>
                {paying ? (sw ? 'Inachakata…' : 'Processing…') : sw ? `Lipa ${formatTZS(MEMBERSHIP_FEE_TZS)} TZS` : `Pay ${formatTZS(MEMBERSHIP_FEE_TZS)} TZS`}
              </button>
              <button className="btn btn-outline" onClick={() => setShowPay(false)} disabled={paying}>
                {sw ? 'Ghairi' : 'Cancel'}
              </button>
            </div>
            <p className="mem-demo-note">
              {sw ? 'Onyesho: malipo yanahifadhiwa kwenye kifaa hiki kwa madhumuni ya maonyesho.' : 'Demo: payment is recorded on this device for demonstration only.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mem-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
