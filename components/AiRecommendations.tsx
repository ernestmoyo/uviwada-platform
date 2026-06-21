'use client'

import { useState } from 'react'

import { useI18n } from '@/lib/i18n'

// AI "areas this centre can improve", from the latest rubric scores.
export function AiRecommendations({ memberId }: { memberId: string }) {
  const { lang } = useI18n()
  const t = (sw: string, en: string) => (lang === 'en' ? en : sw)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    if (loading) return
    setLoading(true); setError(null); setText(null); setMsg(null)
    try {
      const res = await fetch('/api/assessments/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, lang })
      })
      const d = await res.json()
      if (!res.ok) setError(d.detail || d.error || 'Failed')
      else if (d.recommendations) setText(d.recommendations)
      else setMsg(d.message || t('Hakuna tathmini bado.', 'No assessment yet.'))
    } catch {
      setError(t('Hitilafu ya mtandao.', 'Network error.'))
    }
    setLoading(false)
  }

  return (
    <div className="portal-form-card" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0 }}>{t('AI: Maeneo ya kuboresha', 'AI: Areas to improve')}</h3>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            {t('Mapendekezo kutoka tathmini ya hivi karibuni.', 'Suggestions from the latest assessment.')}
          </p>
        </div>
        <button onClick={run} disabled={loading} className="btn btn-primary">
          {loading ? t('Inachakata…', 'Analysing…') : t('Tengeneza', 'Generate')}
        </button>
      </div>
      {error && <p style={{ color: 'var(--accent, #ef4444)', fontSize: '0.85rem' }}>{error}</p>}
      {msg && <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{msg}</p>}
      {text && <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.75rem', fontSize: '0.92rem', lineHeight: 1.5 }}>{text}</div>}
    </div>
  )
}
