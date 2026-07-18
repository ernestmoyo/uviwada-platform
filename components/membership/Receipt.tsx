'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { MEMBERSHIP_PERIOD_LABEL, formatDate, formatTZS } from '@/lib/membership'

interface Props {
  memberId: string
  centreName: string
  ownerName: string
  ward: string
  district: string
}

// The signed-in member's latest payment, from the platform DB (not a per-device
// store) — so the receipt reflects the real recorded payment and its verification.
interface PaymentInfo {
  amount: number
  currency: string
  payment_date: string
  reference_number: string
  method: string
  status: 'pending' | 'verified' | 'rejected'
}

function plusOneYear(iso: string): string {
  const d = new Date(iso)
  d.setFullYear(d.getFullYear() + 1)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function Receipt({ centreName, ownerName, ward, district }: Props) {
  const [payment, setPayment] = useState<PaymentInfo | null>(null)
  const [ready, setReady] = useState(false)

  const load = useCallback(async () => {
    const pr = await fetch('/api/members/payments', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { payment: null }))
      .catch(() => ({ payment: null }))
    setPayment((pr.payment as PaymentInfo | null) ?? null)
    setReady(true)
  }, [])

  useEffect(() => { void load() }, [load])

  if (!ready) return null

  if (!payment) {
    return (
      <div className="doc-shell">
        <div className="doc-empty">
          <p>No payment recorded yet.</p>
          <Link className="btn btn-primary" href="/portal/membership">
            ← Back to Membership
          </Link>
        </div>
      </div>
    )
  }

  const verified = payment.status === 'verified'
  const periodTo = plusOneYear(payment.payment_date)

  return (
    <div className="doc-shell">
      <style>{'@media print { @page { size: A4 portrait; margin: 12mm } }'}</style>
      <div className="doc-toolbar no-print">
        <Link className="btn btn-outline" href="/portal/membership">
          ← Membership
        </Link>
        <span className="doc-signedin">Signed in as: <strong>{centreName}</strong></span>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Download PDF
        </button>
      </div>

      <div className="receipt">
        <div className="receipt-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uviwata_logo.png" alt="UVIWATA" className="receipt-logo" />
          <div className="receipt-org">
            <strong>UVIWATA</strong>
            <span>National Association of Daycare Centre Owners in Tanzania</span>
            <span>UVIWADA — Dar es Salaam Regional Association</span>
          </div>
          <div className="receipt-title">
            <span>OFFICIAL RECEIPT</span>
            <span className="receipt-paid" style={verified ? undefined : { background: '#fef3c7', color: '#92400e' }}>
              {verified ? 'PAID' : 'AWAITING VERIFICATION'}
            </span>
          </div>
        </div>

        <div className="receipt-meta">
          <div>
            <span className="rl">Receipt no.</span>
            <strong>{payment.reference_number}</strong>
          </div>
          <div>
            <span className="rl">Date</span>
            <strong>{formatDate(payment.payment_date)}</strong>
          </div>
        </div>

        <div className="receipt-party">
          <span className="rl">Received from</span>
          <strong>{centreName}</strong>
          <span>{ownerName}</span>
          <span>{ward} · {district}</span>
        </div>

        <table className="receipt-lines">
          <thead>
            <tr>
              <th>Description</th>
              <th>Period</th>
              <th className="ra">Amount (TZS)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{MEMBERSHIP_PERIOD_LABEL} fee</td>
              <td>
                {formatDate(payment.payment_date)} → {formatDate(periodTo)}
              </td>
              <td className="ra">{formatTZS(payment.amount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="ra">
                <strong>Total paid</strong>
              </td>
              <td className="ra">
                <strong>{formatTZS(payment.amount)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="receipt-foot">
          <div>
            <span className="rl">Payment method</span>
            <strong>{payment.method}</strong>
          </div>
          <div className="receipt-stamp">UVIWATA · RECEIVED WITH THANKS</div>
        </div>

        <p className="receipt-note">
          {verified
            ? `This receipt confirms payment of the annual UVIWATA membership fee. Membership is valid through ${formatDate(periodTo)}.`
            : 'This payment has been recorded and is awaiting verification by the UVIWATA secretariat.'}
        </p>
      </div>
    </div>
  )
}
