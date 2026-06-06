'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { MEMBERSHIP_PERIOD_LABEL, formatDate, formatTZS, latestPayment, load, type PaymentRecord } from '@/lib/membership'

interface Props {
  memberId: string
  centreName: string
  ownerName: string
  ward: string
  district: string
}

export function Receipt({ memberId, centreName, ownerName, ward, district }: Props) {
  const [payment, setPayment] = useState<PaymentRecord | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setPayment(latestPayment(load(memberId, centreName)))
    setReady(true)
  }, [memberId, centreName])

  if (!ready) return null

  if (!payment) {
    return (
      <div className="doc-shell">
        <div className="doc-empty">
          <p>No payment found on this device yet.</p>
          <Link className="btn btn-primary" href="/portal/membership">
            ← Back to Membership
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="doc-shell">
      <style>{'@media print { @page { size: A4 portrait; margin: 12mm } }'}</style>
      <div className="doc-toolbar no-print">
        <Link className="btn btn-outline" href="/portal/membership">
          ← Membership
        </Link>
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
            <span className="receipt-paid">PAID</span>
          </div>
        </div>

        <div className="receipt-meta">
          <div>
            <span className="rl">Receipt no.</span>
            <strong>{payment.ref}</strong>
          </div>
          <div>
            <span className="rl">Date</span>
            <strong>{formatDate(payment.date)}</strong>
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
                {formatDate(payment.periodFrom)} → {formatDate(payment.periodTo)}
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
          This receipt confirms payment of the annual UVIWATA membership fee. Membership is valid through {formatDate(payment.periodTo)}.
          Demo document — figures recorded on this device for demonstration.
        </p>
      </div>
    </div>
  )
}
