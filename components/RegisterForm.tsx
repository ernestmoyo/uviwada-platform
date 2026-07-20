'use client'

import { useEffect, useState } from 'react'

import { useI18n } from '@/lib/i18n'
import { WARDS_BY_DISTRICT } from '@/lib/seed-data'

// Fallback coordinates per Dar district — used only when the browser denies
// geolocation. Better than NULL (which excludes the centre from the public
// map) and accurate enough at ward-level for the GIS overview.
const DISTRICT_FALLBACK_GPS: Record<string, { lat: number; lng: number }> = {
  'Kinondoni MC': { lat: -6.77, lng: 39.26 },
  'Dar es Salaam CC': { lat: -6.82, lng: 39.27 },
  'Temeke MC': { lat: -6.87, lng: 39.29 },
  'Kigamboni MC': { lat: -6.85, lng: 39.32 },
  'Ubungo MC': { lat: -6.78, lng: 39.21 }
}
const DEFAULT_DISTRICT = 'Kinondoni MC'

interface FieldError {
  field: string
  label: string
  message: string
}

export function RegisterForm() {
  const { lang } = useI18n()
  const [district, setDistrict] = useState<string>(DEFAULT_DISTRICT)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([])
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)

  // Consent modal (Issue 2) + post-submit "awaiting approval" screen (Issue 3)
  const [pendingPayload, setPendingPayload] = useState<Record<string, string> | null>(null)
  const [consentJoin, setConsentJoin] = useState(false)
  const [consentPublic, setConsentPublic] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  const wards = WARDS_BY_DISTRICT[district] ?? []

  // Try once, non-blocking, to capture a real GPS fix
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // user denied or timeout — district fallback used at submit
      },
      { timeout: 6000, enableHighAccuracy: false }
    )
  }, [])

  // Step 1: the form's submit no longer posts directly — it captures the
  // payload and opens the consent modal. Submission only happens after the
  // owner gives consent (Issue 2).
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors([])
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries()) as Record<string, string>
    const fallback = DISTRICT_FALLBACK_GPS[district] ?? DISTRICT_FALLBACK_GPS[DEFAULT_DISTRICT]
    payload.lat = String(gps?.lat ?? fallback.lat)
    payload.lng = String(gps?.lng ?? fallback.lng)
    setPendingPayload(payload)
    setConsentJoin(false)
    setConsentPublic(true)
  }

  // Step 2: owner has ticked the consent box in the modal and confirmed.
  async function confirmAndSubmit() {
    if (!pendingPayload || !consentJoin) return
    setSubmitting(true)
    setError(null)
    setFieldErrors([])
    const body = {
      ...pendingPayload,
      consent_join: consentJoin,
      consent_public_listing: consentPublic
    }
    try {
      const res = await fetch('/api/members/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = (await res.json()) as {
        ok?: boolean
        pending?: boolean
        error?: string
        fields?: FieldError[]
      }
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Registration failed')
        setFieldErrors(json.fields ?? [])
        setPendingPayload(null)
        setSubmitting(false)
        return
      }
      // Success — centre is created but pending approval. Show the waiting
      // screen rather than signing the owner in (Issue 3).
      setPendingPayload(null)
      setSubmitted(true)
      setSubmitting(false)
    } catch {
      setError('Network error — please check your connection and try again.')
      setPendingPayload(null)
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <div style={{ fontSize: '3rem', lineHeight: 1, marginBottom: '0.75rem' }}>✓</div>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>
          {lang === 'sw' ? 'Ombi limepokelewa!' : 'Registration received!'}
        </h3>
        <p style={{ color: 'var(--muted)', maxWidth: 460, margin: '0 auto' }}>
          {lang === 'sw'
            ? 'Asante. Ombi lako linasubiri kuidhinishwa na Sekretarieti ya UVIWATA. Utapokea taarifa na utaweza kuingia kwenye portal yako mara baada ya kuidhinishwa.'
            : 'Thank you. Your registration is now awaiting approval by the UVIWATA secretariat. You will be notified and able to sign in to your portal once it has been approved.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={onSubmit} className="demo-form">
        <div className="form-group">
          <label htmlFor="centre_name">{lang === 'sw' ? 'Jina la Kituo' : 'Centre Name'}</label>
          <input id="centre_name" name="centre_name" type="text" required placeholder="e.g. Mama Amina Daycare" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="owner_full_name">{lang === 'sw' ? 'Jina la Mmiliki' : 'Owner Full Name'}</label>
            <input id="owner_full_name" name="owner_full_name" type="text" required />
          </div>
          <div className="form-group">
            <label htmlFor="phone">{lang === 'sw' ? 'Simu' : 'Phone'}</label>
            <input id="phone" name="phone" type="tel" required placeholder="+255 7XX XXX XXX" />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">{lang === 'sw' ? 'Barua pepe (hiari)' : 'Email (optional)'}</label>
          <input id="email" name="email" type="email" placeholder="amina@example.com" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="district">{lang === 'sw' ? 'Wilaya' : 'District'}</label>
            <select id="district" name="district" value={district} onChange={(e) => setDistrict(e.target.value)} required>
              {Object.keys(WARDS_BY_DISTRICT).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="ward">{lang === 'sw' ? 'Kata' : 'Ward'}</label>
            <select id="ward" name="ward" required>
              {wards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="address">{lang === 'sw' ? 'Anwani / Maelekezo' : 'Address / Directions'}</label>
          <input id="address" name="address" type="text" placeholder="e.g. Plot 12, Magomeni Road" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="children_count">{lang === 'sw' ? 'Idadi ya Watoto' : 'Total Children'}</label>
            <input id="children_count" name="children_count" type="number" min="0" required defaultValue={20} />
          </div>
          <div className="form-group">
            <label htmlFor="caregiver_count">{lang === 'sw' ? 'Idadi ya Walezi' : 'Caregivers'}</label>
            <input id="caregiver_count" name="caregiver_count" type="number" min="0" required defaultValue={3} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="age_band_0_2">{lang === 'sw' ? 'Miaka 0–2' : '0–2 yrs'}</label>
            <input id="age_band_0_2" name="age_band_0_2" type="number" min="0" defaultValue={6} />
          </div>
          <div className="form-group">
            <label htmlFor="age_band_3_4">{lang === 'sw' ? 'Miaka 3–4' : '3–4 yrs'}</label>
            <input id="age_band_3_4" name="age_band_3_4" type="number" min="0" defaultValue={8} />
          </div>
          <div className="form-group">
            <label htmlFor="age_band_5_6">{lang === 'sw' ? 'Miaka 5–6' : '5–6 yrs'}</label>
            <input id="age_band_5_6" name="age_band_5_6" type="number" min="0" defaultValue={6} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="year_founded">{lang === 'sw' ? 'Mwaka wa Kuanzishwa' : 'Year Founded'}</label>
            <input id="year_founded" name="year_founded" type="number" min="1980" max="2100" defaultValue={2022} />
          </div>
          <div className="form-group">
            <label htmlFor="license_status">{lang === 'sw' ? 'Hali ya Leseni' : 'License Status'}</label>
            <select id="license_status" name="license_status" required defaultValue="pending">
              <option value="fully_licensed">{lang === 'sw' ? 'Imesajiliwa kikamilifu' : 'Fully Licensed'}</option>
              <option value="pending">{lang === 'sw' ? 'Inasubiri' : 'Pending'}</option>
              <option value="not_applied">{lang === 'sw' ? 'Haijaomba' : 'Not Applied'}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="license_number">{lang === 'sw' ? 'Nambari ya Leseni' : 'License Number'}</label>
            <input id="license_number" name="license_number" type="text" />
          </div>
          <div className="form-group">
            <label htmlFor="license_expiry">{lang === 'sw' ? 'Tarehe ya Kuisha' : 'Expiry Date'}</label>
            <input
              id="license_expiry"
              name="license_expiry"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}
          >
            <strong>{error}</strong>
            {fieldErrors.length > 0 && (
              <ul style={{ margin: '0.5rem 0 0 1.1rem', padding: 0 }}>
                {fieldErrors.map((fe) => (
                  <li key={fe.field}>
                    {fe.label}: {fe.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
          {lang === 'sw' ? 'Endelea · Continue' : 'Continue'}
        </button>
      </form>

      {pendingPayload && (
        <ConsentModal
          lang={lang}
          consentJoin={consentJoin}
          consentPublic={consentPublic}
          submitting={submitting}
          onToggleJoin={setConsentJoin}
          onTogglePublic={setConsentPublic}
          onCancel={() => setPendingPayload(null)}
          onConfirm={confirmAndSubmit}
        />
      )}
    </>
  )
}

interface ConsentModalProps {
  lang: string
  consentJoin: boolean
  consentPublic: boolean
  submitting: boolean
  onToggleJoin: (v: boolean) => void
  onTogglePublic: (v: boolean) => void
  onCancel: () => void
  onConfirm: () => void
}

function ConsentModal({
  lang,
  consentJoin,
  consentPublic,
  submitting,
  onToggleJoin,
  onTogglePublic,
  onCancel,
  onConfirm
}: ConsentModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          maxWidth: 560,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem 1.75rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 0.75rem 0' }}>
          {lang === 'sw' ? 'Idhini ya Usajili' : 'Registration Consent'}
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
          {lang === 'sw'
            ? 'Kabla ya kuwasilisha, tafadhali toa idhini yako. Taarifa ulizotoa zitatumika na UVIWATA kwa ajili ya usajili, ukaguzi wa ubora, na mafunzo. Zitahifadhiwa kwa usalama.'
            : 'Before submitting, please give your consent. The information you provide will be used by UVIWATA for membership, quality assessment, and training purposes, and stored securely.'}
        </p>

        <label
          style={{
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'flex-start',
            margin: '1rem 0',
            cursor: 'pointer',
            fontSize: '0.92rem'
          }}
        >
          <input
            type="checkbox"
            checked={consentJoin}
            onChange={(e) => onToggleJoin(e.target.checked)}
            style={{ marginTop: '0.2rem', width: 18, height: 18, flexShrink: 0 }}
          />
          <span>
            {lang === 'sw'
              ? 'Ninakubali kujiunga na UVIWATA na natoa idhini ya taarifa zangu kuhifadhiwa na kutumika kama ilivyoelezwa. (Inahitajika)'
              : 'I consent to join UVIWATA and to my information being stored and used as described. (Required)'}
          </span>
        </label>

        <label
          style={{
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'flex-start',
            margin: '0.5rem 0 1.25rem 0',
            cursor: 'pointer',
            fontSize: '0.92rem'
          }}
        >
          <input
            type="checkbox"
            checked={consentPublic}
            onChange={(e) => onTogglePublic(e.target.checked)}
            style={{ marginTop: '0.2rem', width: 18, height: 18, flexShrink: 0 }}
          />
          <span>
            {lang === 'sw'
              ? 'Ninakubali kituo changu kuoneshwa kwenye orodha ya umma na ramani ya UVIWATA. (Hiari)'
              : 'I consent to my centre being listed publicly in the UVIWATA directory and map. (Optional)'}
          </span>
        </label>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={onCancel}
            disabled={submitting}
            style={{ background: 'var(--bg-alt)', color: 'var(--text)' }}
          >
            {lang === 'sw' ? 'Ghairi' : 'Cancel'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={!consentJoin || submitting}
          >
            {submitting
              ? lang === 'sw'
                ? 'Inapeleka…'
                : 'Submitting…'
              : lang === 'sw'
                ? 'Kubali na Wasilisha'
                : 'Agree & Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
