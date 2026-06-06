'use client'

// Demo membership / payment / certificate store.
//
// Deliberately client-side (localStorage) so the demo never writes to the live
// database — payments, receipts and certificate approvals are recorded per
// browser and clearly labelled as demonstration data. The shape mirrors the V2
// "Payment and subscription record" (§399–401) and certificate model (§606–625)
// so it can be re-pointed at a real backend later without UI changes.

export const MEMBERSHIP_FEE_TZS = 100000 // annual membership fee (demo assumption)
export const MEMBERSHIP_PERIOD_LABEL = 'Annual membership 2026'

export type PaymentMethod = 'M-Pesa' | 'Tigo Pesa' | 'Airtel Money' | 'Bank transfer'

export const PAYMENT_METHODS: PaymentMethod[] = ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Bank transfer']

export interface PaymentRecord {
  ref: string
  date: string // ISO
  amount: number
  method: PaymentMethod
  periodFrom: string // ISO date
  periodTo: string // ISO date
}

export interface MembershipRecord {
  memberId: string
  centreName: string
  payments: PaymentRecord[]
  // certificate lifecycle: none → requested (on first payment) → issued (admin)
  certStatus: 'none' | 'requested' | 'issued'
  certRef: string | null
  certApprovedBy: string | null
  certApprovedDate: string | null // ISO
}

const PREFIX = 'uviwata.membership.'
const EVENT = 'uviwata-membership-change'

function key(memberId: string) {
  return PREFIX + memberId
}

function emptyRecord(memberId: string, centreName: string): MembershipRecord {
  return {
    memberId,
    centreName,
    payments: [],
    certStatus: 'none',
    certRef: null,
    certApprovedBy: null,
    certApprovedDate: null
  }
}

function pad(n: number, w = 4): string {
  return String(n).padStart(w, '0')
}

function randomDigits(n: number): string {
  let s = ''
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10)
  return s
}

export function load(memberId: string, centreName = ''): MembershipRecord {
  if (typeof window === 'undefined') return emptyRecord(memberId, centreName)
  try {
    const raw = window.localStorage.getItem(key(memberId))
    if (!raw) return emptyRecord(memberId, centreName)
    const parsed = JSON.parse(raw) as MembershipRecord
    // keep the centre name fresh from the session
    if (centreName) parsed.centreName = centreName
    return parsed
  } catch {
    return emptyRecord(memberId, centreName)
  }
}

function save(record: MembershipRecord): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key(record.memberId), JSON.stringify(record))
  window.dispatchEvent(new CustomEvent(EVENT, { detail: record.memberId }))
}

export function isActive(record: MembershipRecord): boolean {
  const latest = record.payments[record.payments.length - 1]
  if (!latest) return false
  return new Date(latest.periodTo).getTime() >= Date.now()
}

export function latestPayment(record: MembershipRecord): PaymentRecord | null {
  return record.payments[record.payments.length - 1] ?? null
}

export function recordPayment(memberId: string, centreName: string, method: PaymentMethod): MembershipRecord {
  const record = load(memberId, centreName)
  const now = new Date()
  const to = new Date(now)
  to.setFullYear(to.getFullYear() + 1)
  const seq = record.payments.length + 1
  const payment: PaymentRecord = {
    ref: `UVW-RC-${now.getFullYear()}-${randomDigits(5)}`,
    date: now.toISOString(),
    amount: MEMBERSHIP_FEE_TZS,
    method,
    periodFrom: now.toISOString(),
    periodTo: to.toISOString()
  }
  const next: MembershipRecord = {
    ...record,
    centreName,
    payments: [...record.payments, payment],
    // first payment raises a certificate request for Secretariat approval
    certStatus: record.certStatus === 'issued' ? 'issued' : 'requested',
    certRef: record.certRef ?? `UVW-CERT-${now.getFullYear()}-${pad(seq)}-${randomDigits(3)}`
  }
  save(next)
  return next
}

export function approveCertificate(memberId: string, approver: string): MembershipRecord {
  const record = load(memberId)
  const now = new Date()
  const next: MembershipRecord = {
    ...record,
    certStatus: 'issued',
    certRef: record.certRef ?? `UVW-CERT-${now.getFullYear()}-0001-${randomDigits(3)}`,
    certApprovedBy: approver,
    certApprovedDate: now.toISOString()
  }
  save(next)
  return next
}

export function listAll(): MembershipRecord[] {
  if (typeof window === 'undefined') return []
  const out: MembershipRecord[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (!k || !k.startsWith(PREFIX)) continue
    try {
      out.push(JSON.parse(window.localStorage.getItem(k) as string) as MembershipRecord)
    } catch {
      // skip corrupt entry
    }
  }
  return out
}

export function onChange(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const fn = () => handler()
  window.addEventListener(EVENT, fn)
  window.addEventListener('storage', fn) // cross-tab / cross-session (admin ↔ member)
  return () => {
    window.removeEventListener(EVENT, fn)
    window.removeEventListener('storage', fn)
  }
}

export function formatTZS(n: number): string {
  return n.toLocaleString('en-US')
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
