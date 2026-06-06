'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { formatDate, latestPayment, load, type MembershipRecord } from '@/lib/membership'

interface Props {
  memberId: string
  centreName: string
  ownerName: string
  ward: string
  district: string
}

export function Certificate({ memberId, centreName, ownerName, ward, district }: Props) {
  const [record, setRecord] = useState<MembershipRecord | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setRecord(load(memberId, centreName))
    setReady(true)
  }, [memberId, centreName])

  if (!ready) return null

  if (!record || record.certStatus !== 'issued') {
    return (
      <div className="doc-shell">
        <div className="doc-empty">
          <p>
            {record?.certStatus === 'requested'
              ? 'Your certificate is awaiting Secretariat approval.'
              : 'Pay your membership fee to request a certificate.'}
          </p>
          <Link className="btn btn-primary" href="/portal/membership">
            ← Back to Membership
          </Link>
        </div>
      </div>
    )
  }

  const payment = latestPayment(record)
  const validThrough = payment ? formatDate(payment.periodTo) : '—'
  const issued = record.certApprovedDate ? formatDate(record.certApprovedDate) : formatDate(new Date().toISOString())

  return (
    <div className="doc-shell doc-shell-wide">
      <style>{'@media print { @page { size: A4 landscape; margin: 8mm } }'}</style>
      <div className="doc-toolbar no-print">
        <Link className="btn btn-outline" href="/portal/membership">
          ← Membership
        </Link>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Download PDF
        </button>
      </div>

      <div className="cert">
        <div className="cert-border">
          <div className="cert-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/uviwata_logo.png" alt="UVIWATA" className="cert-logo" />
            <div className="cert-org">National Association of Daycare Centre Owners in Tanzania</div>

            <h1 className="cert-title">Certificate of Membership</h1>
            <div className="cert-rule" />

            <p className="cert-lead">This is to certify that</p>
            <p className="cert-name">{centreName}</p>
            <p className="cert-sub">
              {ownerName ? `${ownerName} · ` : ''}
              {ward}
              {district ? `, ${district}` : ''}
            </p>

            <p className="cert-body">
              is a registered member in good standing of <strong>UVIWATA</strong>, through its Dar es Salaam regional
              association <strong>UVIWADA</strong>, recognised within the national daycare sector and entitled to all
              rights and benefits of membership for the period ending <strong>{validThrough}</strong>.
            </p>

            <div className="cert-foot">
              <div className="cert-sig">
                <div className="cert-sig-line">UVIWATA Secretariat</div>
                <span>{record.certApprovedBy ?? 'Authorised Signatory'}</span>
              </div>

              <div className="cert-seal">
                <div className="cert-seal-ring">
                  <span>UVIWATA</span>
                  <small>VERIFIED</small>
                </div>
              </div>

              <div className="cert-sig">
                <div className="cert-sig-line">{issued}</div>
                <span>Date of issue</span>
              </div>
            </div>

            <div className="cert-meta">
              <div className="cert-qr" aria-hidden>
                <div className="cert-qr-grid" />
                <span>Scan to verify</span>
              </div>
              <div className="cert-ref">
                <span>Certificate No.</span>
                <strong>{record.certRef}</strong>
              </div>
              <div className="cert-tag">“Tanzania’s trusted digital gateway for a visible, connected and stronger daycare sector.”</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
