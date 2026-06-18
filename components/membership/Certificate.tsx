'use client'

import Link from 'next/link'
import { fmtDate } from '@/lib/format'
import { useEffect, useState } from 'react'

interface Props {
  memberId: string
  centreName: string
  ownerName: string
  ward: string
  district: string
}

interface CertStatus {
  status: 'none' | 'requested' | 'issued' | 'revoked'
  cert_ref: string | null
  period_label: string | null
  approved_at: string | null
}

function fmt(iso: string | null): string {
  if (!iso) return ''
  try {
    return fmtDate(iso)
  } catch {
    return ''
  }
}

export function Certificate({ memberId: _memberId, centreName, ownerName, ward, district }: Props) {
  const [cert, setCert] = useState<CertStatus | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    void fetch('/api/members/certificate', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { status: 'none' }))
      .then((j: CertStatus) => {
        if (alive) {
          setCert(j)
          setReady(true)
        }
      })
      .catch(() => {
        if (alive) {
          setCert({ status: 'none', cert_ref: null, period_label: null, approved_at: null })
          setReady(true)
        }
      })
    return () => {
      alive = false
    }
  }, [])

  if (!ready) return null

  if (!cert || cert.status !== 'issued') {
    return (
      <div className="doc-shell">
        <div className="doc-empty">
          <p>
            {cert?.status === 'requested'
              ? 'Your certificate is awaiting Secretariat approval.'
              : 'Once the Secretariat records your verified payment, your certificate is issued here.'}
          </p>
          <Link className="btn btn-primary" href="/portal/membership">
            ← Back to Membership
          </Link>
        </div>
      </div>
    )
  }

  const issued = fmt(cert.approved_at) || fmt(new Date().toISOString())

  return (
    <div className="doc-shell doc-shell-wide">
      <div className="doc-toolbar no-print">
        <Link className="btn btn-outline" href="/portal/membership">
          ← Membership
        </Link>
        <span className="doc-signedin">Signed in as: <strong>{centreName}</strong></span>
        <a className="btn btn-primary" href="/api/members/certificate/pdf">
          Download PDF
        </a>
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
              rights and benefits of membership for <strong>{cert.period_label ?? 'the current membership period'}</strong>.
            </p>

            <div className="cert-foot">
              <div className="cert-sig">
                <div className="cert-sig-line">UVIWATA Secretariat</div>
                <span>Authorised Signatory</span>
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
              <div className="cert-ref">
                <span>Certificate No.</span>
                <strong>{cert.cert_ref}</strong>
              </div>
              <div className="cert-tag">&ldquo;Tanzania&rsquo;s trusted digital gateway for a visible, connected and stronger daycare sector.&rdquo;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
