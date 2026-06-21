'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { useI18n } from '@/lib/i18n'
import { fmtNum, fmtDate } from '@/lib/format'

interface Props {
  memberId: string
  centreName: string
}

const FEE_TZS = 100000

const METHODS: { value: string; label: string }[] = [
  { value: 'mobile_money', label: 'M-Pesa / Mobile money' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' }
]

interface PaymentInfo {
  amount: number
  currency: string
  payment_date: string
  reference_number: string
  method: string
  status: 'pending' | 'verified' | 'rejected'
  verified_at: string | null
}
interface CertInfo {
  status: 'none' | 'requested' | 'issued' | 'revoked'
  cert_ref: string | null
  approved_at: string | null
}

export function MembershipPanel({ memberId: _memberId, centreName: _centreName }: Props) {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  const [payment, setPayment] = useState<PaymentInfo | null>(null)
  const [cert, setCert] = useState<CertInfo | null>(null)
  const [ready, setReady] = useState(false)

  const [showPay, setShowPay] = useState(false)
  const [method, setMethod] = useState('mobile_money')
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSubmitted, setJustSubmitted] = useState(false)

  const load = useCallback(async () => {
    const [pr, cr] = await Promise.all([
      fetch('/api/members/payments', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { payment: null })).catch(() => ({ payment: null })),
      fetch('/api/members/certificate', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { status: 'none' })).catch(() => ({ status: 'none' }))
    ])
    setPayment(pr.payment ?? null)
    setCert({ status: cr.status ?? 'none', cert_ref: cr.cert_ref ?? null, approved_at: cr.approved_at ?? null })
    setReady(true)
  }, [])

  useEffect(() => { void load() }, [load])

  // Auto-refresh so the member sees the secretariat's verification / certificate
  // issuance without a manual hard refresh: re-check when the tab regains focus,
  // and poll every 15s while still waiting (until the certificate is issued).
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void load() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    const id = cert?.status === 'issued' ? undefined : setInterval(refresh, 15000)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      if (id) clearInterval(id)
    }
  }, [load, cert?.status])

  async function submitPayment() {
    if (submitting) return
    if (!reference.trim()) { setError(sw ? 'Weka namba ya rejea ya malipo.' : 'Enter the payment reference number.'); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/members/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: FEE_TZS, method, reference_number: reference.trim() })
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) {
        setError(json.error ?? (sw ? 'Imeshindikana kutuma malipo.' : 'Could not submit payment.'))
        setSubmitting(false)
        return
      }
      setShowPay(false)
      setReference('')
      setJustSubmitted(true)
      setSubmitting(false)
      await load()
    } catch {
      setError(sw ? 'Hitilafu ya mtandao — jaribu tena.' : 'Network error — please try again.')
      setSubmitting(false)
    }
  }

  if (!ready) return null

  const status = payment?.status ?? null
  const pill =
    status === 'verified'
      ? { cls: 'mem-pill-active', text: sw ? 'Hai · Imethibitishwa' : 'Active · Verified' }
      : status === 'pending'
        ? { cls: 'mem-pill-due', text: sw ? 'Inasubiri uthibitisho' : 'Awaiting verification' }
        : { cls: 'mem-pill-none', text: sw ? 'Inasubiri malipo' : 'Payment due' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
      {/* Membership status + payment */}
      <div className="mem-card">
        <div className="mem-card-head">
          <h3>{sw ? 'Uanachama' : 'Membership'}</h3>
          <span className={`mem-pill ${pill.cls}`}>{pill.text}</span>
        </div>

        <div className="mem-fee">
          <span className="mem-fee-num">{fmtNum(FEE_TZS)}</span>
          <span className="mem-fee-unit">TZS / {sw ? 'mwaka' : 'year'}</span>
        </div>

        {payment ? (
          <div className="mem-rows">
            <Row label={sw ? 'Imetumwa' : 'Submitted'} value={fmtDate(payment.payment_date)} />
            <Row label={sw ? 'Namba ya rejea' : 'Reference'} value={payment.reference_number} />
            <Row label={sw ? 'Njia' : 'Method'} value={payment.method.replace('_', ' ')} />
            <Row
              label={sw ? 'Hali' : 'Status'}
              value={status === 'verified' ? (sw ? 'Imethibitishwa' : 'Verified') : status === 'pending' ? (sw ? 'Inasubiri uthibitisho' : 'Awaiting verification') : (sw ? 'Imekataliwa' : 'Rejected')}
            />
          </div>
        ) : (
          <p className="mem-note">
            {sw ? 'Hujatuma malipo ya ada ya uanachama mwaka huu.' : 'You have not submitted a membership payment this year.'}
          </p>
        )}

        <div className="mem-actions">
          <button className="btn btn-primary" onClick={() => { setShowPay(true); setJustSubmitted(false); setError(null) }} disabled={status === 'pending'}>
            {status === 'verified' ? (sw ? 'Lipia upya' : 'Renew membership') : sw ? 'Tuma malipo' : 'Submit payment'}
          </button>
        </div>

        {status === 'pending' && (
          <div className="mem-note" style={{ marginTop: '0.6rem' }}>
            {sw
              ? 'Malipo yako yamepokelewa na yanasubiri uthibitisho wa Sekretarieti. Cheti kitatolewa baada ya uthibitisho.'
              : 'Your payment has been received and is awaiting secretariat verification. Your certificate is issued once verified.'}
          </div>
        )}
        {justSubmitted && status === 'pending' && (
          <div className="mem-success">
            ✓ {sw ? 'Malipo yametumwa kwa uthibitisho.' : 'Payment submitted for verification.'}
          </div>
        )}
      </div>

      {/* Certificate */}
      <div className="mem-card">
        <div className="mem-card-head">
          <h3>{sw ? 'Cheti cha Uanachama' : 'Membership Certificate'}</h3>
          <span className={`mem-pill ${cert?.status === 'issued' ? 'mem-pill-active' : cert?.status === 'requested' ? 'mem-pill-due' : 'mem-pill-none'}`}>
            {cert?.status === 'issued' ? (sw ? 'Imetolewa' : 'Issued') : cert?.status === 'requested' ? (sw ? 'Inashughulikiwa' : 'Processing') : (sw ? 'Bado' : 'Not issued')}
          </span>
        </div>

        {(!cert || cert.status === 'none') && (
          <p className="mem-note">
            {sw
              ? 'Tuma malipo ya ada; baada ya Sekretarieti kuthibitisha, cheti chako cha uanachama kitatolewa hapa.'
              : 'Submit your fee; once the secretariat verifies it, your membership certificate is issued here.'}
          </p>
        )}
        {cert?.status === 'requested' && (
          <p className="mem-note">
            {sw ? 'Cheti chako kinashughulikiwa baada ya uthibitisho wa malipo.' : 'Your certificate is being processed following payment verification.'}
          </p>
        )}
        {cert?.status === 'issued' && (
          <>
            <div className="mem-rows">
              <Row label={sw ? 'Namba ya cheti' : 'Certificate no.'} value={cert.cert_ref ?? '—'} />
              {cert.approved_at && <Row label={sw ? 'Tarehe' : 'Date'} value={fmtDate(cert.approved_at)} />}
            </div>
            <div className="mem-actions">
              <Link className="btn btn-primary" href="/portal/certificate">
                {sw ? 'Pakua cheti (PDF)' : 'Download certificate (PDF)'}
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Pay modal */}
      {showPay && (
        <div className="mem-modal-backdrop" onClick={() => !submitting && setShowPay(false)}>
          <div className="mem-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{sw ? 'Tuma malipo ya ada' : 'Submit membership payment'}</h3>
            <p className="mem-modal-amount">{fmtNum(FEE_TZS)} TZS · {sw ? 'mwaka 1' : '1 year'}</p>

            <label className="mem-modal-label">{sw ? 'Njia ya malipo' : 'Payment method'}</label>
            <div className="mem-methods">
              {METHODS.map((m) => (
                <button key={m.value} type="button" className={`mem-method ${method === m.value ? 'active' : ''}`} onClick={() => setMethod(m.value)} disabled={submitting}>
                  {m.label}
                </button>
              ))}
            </div>

            <label className="mem-modal-label" style={{ marginTop: '0.8rem' }} htmlFor="payref">
              {sw ? 'Namba ya rejea (mf. namba ya M-Pesa)' : 'Reference number (e.g. M-Pesa code)'}
            </label>
            <input
              id="payref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={sw ? 'mf. QGH7X8K2LP' : 'e.g. QGH7X8K2LP'}
              disabled={submitting}
              style={{ width: '100%', padding: '0.55rem 0.7rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.95rem', marginTop: '0.3rem' }}
            />

            {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}

            <div className="mem-actions" style={{ marginTop: '1.1rem' }}>
              <button className="btn btn-primary" onClick={submitPayment} disabled={submitting}>
                {submitting ? (sw ? 'Inatuma…' : 'Submitting…') : sw ? 'Tuma malipo' : 'Submit payment'}
              </button>
              <button className="btn btn-outline" onClick={() => setShowPay(false)} disabled={submitting}>
                {sw ? 'Ghairi' : 'Cancel'}
              </button>
            </div>
            <p className="mem-demo-note">
              {sw
                ? 'Malipo yanatumwa kwa Sekretarieti kuthibitishwa. Hakuna malipo ya moja kwa moja bado.'
                : 'Your payment is sent to the secretariat for verification. No automated charge is taken.'}
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
