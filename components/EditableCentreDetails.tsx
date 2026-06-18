'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { useI18n } from '@/lib/i18n'

export interface EditableCentre {
  phone: string
  email: string | null
  address: string | null
  caregiver_count: number
  license_status: string
  license_number: string | null
  license_expiry: string | null
}

interface FieldError {
  field: string
  label: string
  message: string
}

interface EditableCentreDetailsProps {
  centre: EditableCentre
}

const LICENSE_OPTIONS = [
  { value: 'fully_licensed', en: 'Fully Licensed', sw: 'Imesajiliwa kikamilifu' },
  { value: 'pending', en: 'Pending', sw: 'Inasubiri' },
  { value: 'not_applied', en: 'Not Applied', sw: 'Haijaomba' },
  { value: 'expired', en: 'Expired', sw: 'Imeisha' }
]

export function EditableCentreDetails({ centre }: EditableCentreDetailsProps) {
  const { lang } = useI18n()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([])

  const [form, setForm] = useState({
    phone: centre.phone ?? '',
    email: centre.email ?? '',
    address: centre.address ?? '',
    caregiver_count: String(centre.caregiver_count ?? 0),
    license_status: centre.license_status ?? 'pending',
    license_number: centre.license_number ?? '',
    license_expiry: centre.license_expiry ?? ''
  })

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function cancel() {
    setForm({
      phone: centre.phone ?? '',
      email: centre.email ?? '',
      address: centre.address ?? '',
      caregiver_count: String(centre.caregiver_count ?? 0),
      license_status: centre.license_status ?? 'pending',
      license_number: centre.license_number ?? '',
      license_expiry: centre.license_expiry ?? ''
    })
    setError(null)
    setFieldErrors([])
    setEditing(false)
  }

  async function save() {
    setSaving(true)
    setError(null)
    setFieldErrors([])
    try {
      const res = await fetch('/api/members/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const json = (await res.json()) as { ok?: boolean; error?: string; fields?: FieldError[] }
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Could not save changes')
        setFieldErrors(json.fields ?? [])
        setSaving(false)
        return
      }
      setSaving(false)
      setEditing(false)
      router.refresh()
    } catch {
      setError('Network error — please try again.')
      setSaving(false)
    }
  }

  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
          gap: '1rem'
        }}
      >
        <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Centre Details · Maelezo ya Kituo</h2>
        {!editing && (
          <button className="btn btn-primary" style={{ padding: '0.4rem 0.9rem' }} onClick={() => setEditing(true)}>
            {lang === 'sw' ? 'Hariri' : 'Edit'}
          </button>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              borderRadius: 8,
              padding: '0.7rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.88rem'
            }}
          >
            <strong>{error}</strong>
            {fieldErrors.length > 0 && (
              <ul style={{ margin: '0.4rem 0 0 1.1rem', padding: 0 }}>
                {fieldErrors.map((fe) => (
                  <li key={fe.field}>
                    {fe.label}: {fe.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!editing ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}
          >
            <Detail label="Phone · Simu" value={centre.phone || '—'} />
            <Detail label="Email" value={centre.email ?? '—'} />
            <Detail label="Address · Anwani" value={centre.address ?? '—'} />
            <Detail label="Caregivers · Walezi" value={String(centre.caregiver_count)} />
            <Detail label="License Status" value={licenseLabel(centre.license_status, lang)} />
            <Detail label="License #" value={centre.license_number ?? '—'} />
            <Detail label="License Expiry" value={centre.license_expiry ?? '—'} />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem'
            }}
          >
            <Field label="Phone · Simu">
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} type="tel" style={inputStyle} />
            </Field>
            <Field label="Email">
              <input value={form.email} onChange={(e) => set('email', e.target.value)} type="email" style={inputStyle} />
            </Field>
            <Field label="Address · Anwani">
              <input value={form.address} onChange={(e) => set('address', e.target.value)} type="text" style={inputStyle} />
            </Field>
            <Field label="Caregivers · Walezi">
              <input
                value={form.caregiver_count}
                onChange={(e) => set('caregiver_count', e.target.value)}
                type="number"
                min="0"
                style={inputStyle}
              />
            </Field>
            <Field label="License Status">
              <select
                value={form.license_status}
                onChange={(e) => set('license_status', e.target.value)}
                style={inputStyle}
              >
                {LICENSE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {lang === 'sw' ? o.sw : o.en}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="License #">
              <input
                value={form.license_number}
                onChange={(e) => set('license_number', e.target.value)}
                type="text"
                style={inputStyle}
              />
            </Field>
            <Field label="License Expiry">
              <input
                value={form.license_expiry}
                onChange={(e) => set('license_expiry', e.target.value)}
                type="date"
                style={inputStyle}
              />
            </Field>
          </div>
        )}

        {editing && (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button
              className="btn"
              onClick={cancel}
              disabled={saving}
              style={{ background: 'var(--bg-alt)', color: 'var(--text)' }}
            >
              {lang === 'sw' ? 'Ghairi' : 'Cancel'}
            </button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? (lang === 'sw' ? 'Inahifadhi…' : 'Saving…') : lang === 'sw' ? 'Hifadhi' : 'Save changes'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 500, marginTop: '0.15rem' }}>{value}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '0.72rem',
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.3rem'
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function licenseLabel(status: string, lang: string): string {
  const o = LICENSE_OPTIONS.find((x) => x.value === status)
  if (!o) return status
  return lang === 'sw' ? o.sw : o.en
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.65rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '0.92rem'
}
