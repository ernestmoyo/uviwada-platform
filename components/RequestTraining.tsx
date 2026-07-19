'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { useI18n } from '@/lib/i18n'

const CATEGORIES = [
  { value: '', sw: '— Aina (hiari) —', en: '— Category (optional) —' },
  { value: 'safeguarding', sw: 'Ulinzi wa Mtoto', en: 'Safeguarding' },
  { value: 'curriculum', sw: 'Mtaala', en: 'Curriculum' },
  { value: 'nutrition', sw: 'Lishe', en: 'Nutrition' },
  { value: 'health_hygiene', sw: 'Afya na Usafi', en: 'Health & Hygiene' },
  { value: 'staffing', sw: 'Wafanyakazi', en: 'Staffing' },
  { value: 'infrastructure', sw: 'Miundombinu', en: 'Infrastructure' }
]

// DCC-facing: request a training topic. The secretariat sees these on /admin/trainings.
export function RequestTraining() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (busy) return
    if (topic.trim().length < 2) { setError(sw ? 'Andika mada ya mafunzo.' : 'Enter a training topic.'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/trainings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), category: category || undefined, note: note.trim() || undefined })
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) { setError(json.error ?? (sw ? 'Imeshindikana.' : 'Could not submit.')); setBusy(false); return }
      setDone(true); setBusy(false); setTopic(''); setCategory(''); setNote(''); setOpen(false)
      router.refresh()
    } catch {
      setError(sw ? 'Hitilafu ya mtandao.' : 'Network error.'); setBusy(false)
    }
  }

  if (done && !open) {
    return (
      <p style={{ fontSize: '0.85rem', color: '#166534', marginTop: '0.5rem' }}>
        ✓ {sw ? 'Ombi lako la mafunzo limetumwa kwa sekretarieti.' : 'Your training request was sent to the secretariat.'}{' '}
        <button type="button" onClick={() => { setDone(false); setOpen(true) }} style={{ background: 'none', border: 'none', color: 'var(--link)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}>
          {sw ? 'Omba nyingine' : 'Request another'}
        </button>
      </p>
    )
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline" style={{ marginTop: '0.5rem', padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
        {sw ? '+ Omba mafunzo' : '+ Request a training'}
      </button>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow)', padding: '1rem', marginTop: '0.75rem', display: 'grid', gap: '0.6rem' }}>
      <strong style={{ fontSize: '0.9rem' }}>{sw ? 'Omba mafunzo' : 'Request a training'}</strong>
      <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={sw ? 'Mada, mf. Usalama wa moto' : 'Topic, e.g. Fire safety'} style={inp} />
      <select value={category} onChange={(e) => setCategory(e.target.value)} style={inp}>
        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{sw ? c.sw : c.en}</option>)}
      </select>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={sw ? 'Maelezo (hiari)' : 'Note (optional)'} style={inp} />
      {error && <span style={{ color: 'var(--accent, #ef4444)', fontSize: '0.82rem' }}>{error}</span>}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" onClick={submit} disabled={busy} className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
          {busy ? (sw ? 'Inatuma…' : 'Sending…') : (sw ? 'Tuma ombi' : 'Send request')}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
          {sw ? 'Ghairi' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}

const inp: React.CSSProperties = { padding: '0.5rem 0.7rem', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'inherit', fontSize: '0.9rem', width: '100%' }
