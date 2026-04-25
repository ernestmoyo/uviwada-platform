'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useI18n } from '@/lib/i18n'
import { WARDS_BY_DISTRICT } from '@/lib/seed-data'

export function RegisterForm() {
  const { lang } = useI18n()
  const router = useRouter()
  const [district, setDistrict] = useState<string>('Kinondoni')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wards = WARDS_BY_DISTRICT[district] ?? []

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())

    try {
      const res = await fetch('/api/members/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = (await res.json()) as { ok?: boolean; redirect?: string; error?: string; detail?: string }
      if (!res.ok || !json.ok) {
        setError(json.detail ?? json.error ?? 'Registration failed')
        setSubmitting(false)
        return
      }
      router.push(json.redirect ?? '/portal')
      router.refresh()
    } catch {
      setError('Network error')
      setSubmitting(false)
    }
  }

  return (
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
          <label htmlFor="age_band_0_2">0–2 yrs</label>
          <input id="age_band_0_2" name="age_band_0_2" type="number" min="0" defaultValue={6} />
        </div>
        <div className="form-group">
          <label htmlFor="age_band_3_4">3–4 yrs</label>
          <input id="age_band_3_4" name="age_band_3_4" type="number" min="0" defaultValue={8} />
        </div>
        <div className="form-group">
          <label htmlFor="age_band_5_6">5–6 yrs</label>
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
          <input id="license_expiry" name="license_expiry" type="date" />
        </div>
      </div>

      {error && <p style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{error}</p>}

      <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
        {submitting ? (lang === 'sw' ? 'Inapeleka…' : 'Submitting…') : lang === 'sw' ? 'Sajili na Ingia' : 'Register & Sign In'}
      </button>
    </form>
  )
}
