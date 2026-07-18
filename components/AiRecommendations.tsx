'use client'

import { useState, type ReactNode } from 'react'

import { useI18n } from '@/lib/i18n'

// Render the AI Markdown as clean formatted text (no raw **, #, --- markers):
// headings (#/##/###), bold (**x**), bullets (- / *), rules, stray * stripped.
function parseInline(s: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  const strip = (x: string) => x.replace(/\*+/g, '')
  while ((m = re.exec(s))) {
    if (m.index > last) nodes.push(strip(s.slice(last, m.index)))
    nodes.push(<strong key={`b${k++}`}>{m[1]}</strong>)
    last = m.index + m[0].length
  }
  if (last < s.length) nodes.push(strip(s.slice(last)))
  return nodes
}

function RichText({ text }: { text: string }) {
  const lines = String(text ?? '').split('\n')
  return (
    <div style={{ marginTop: '0.75rem', fontSize: '0.92rem', lineHeight: 1.55 }}>
      {lines.map((raw, i) => {
        if (/^\s*(-\s*){3,}\s*$/.test(raw) || /^\s*-{3,}\s*$/.test(raw)) {
          return <div key={i} style={{ height: 1, background: 'var(--border, #e5e7eb)', margin: '12px 0' }} />
        }
        if (raw.trim() === '') return <div key={i} style={{ height: 6 }} />
        const hm = raw.match(/^\s*(#{1,6})\s+(.*)$/)
        if (hm) {
          const level = hm[1].length
          return (
            <div key={i} style={{ fontWeight: 800, fontSize: level <= 1 ? '1.05rem' : level === 2 ? '0.98rem' : '0.92rem', margin: '0.7rem 0 0.15rem' }}>
              {parseInline(hm[2])}
            </div>
          )
        }
        const bm = raw.match(/^\s*[-*]\s+(.*)$/)
        if (bm) {
          return (
            <div key={i} style={{ position: 'relative', margin: '0.15rem 0 0.15rem 1rem' }}>
              <span style={{ position: 'absolute', left: '-0.9rem' }}>•</span>
              {parseInline(bm[1])}
            </div>
          )
        }
        return <div key={i} style={{ margin: '0.15rem 0' }}>{parseInline(raw)}</div>
      })}
    </div>
  )
}

// AI "areas this centre can improve", from the latest rubric scores.
export function AiRecommendations({ memberId, centreName }: { memberId: string; centreName?: string }) {
  const { lang } = useI18n()
  const t = (sw: string, en: string) => (lang === 'en' ? en : sw)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

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

  async function downloadWord() {
    if (!text || downloading) return
    setDownloading(true)
    try {
      const res = await fetch('/api/assessments/recommendations/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, centreName, lang })
      })
      if (!res.ok) { setError(t('Imeshindwa kupakua.', 'Download failed.')); setDownloading(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `UVIWATA - ${t('Maeneo ya kuboresha', 'Areas to improve')}${centreName ? ` - ${centreName}` : ''}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError(t('Hitilafu ya mtandao.', 'Network error.'))
    }
    setDownloading(false)
  }

  return (
    <div className="portal-form-card" style={{ marginTop: '1rem', borderTop: '4px solid #1EB53A' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden>✨</span>{t('AI: Maeneo ya kuboresha', 'AI: Areas to improve')}
          </h3>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            {t('Mapendekezo kutoka tathmini ya hivi karibuni.', 'Suggestions from the latest assessment.')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {text && (
            <button type="button" onClick={downloadWord} disabled={downloading}
              style={{ background: '#1EB53A', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 8, padding: '0.5rem 0.9rem', cursor: 'pointer' }}>
              ↓ {downloading ? t('Inapakua…', 'Preparing…') : t('Pakua Word', 'Download Word')}
            </button>
          )}
          <button type="button" onClick={run} disabled={loading} className="btn btn-primary">
            {loading ? t('Inachakata…', 'Analysing…') : text ? t('Tengeneza upya', 'Regenerate') : t('Tengeneza', 'Generate')}
          </button>
        </div>
      </div>
      {error && <p style={{ color: 'var(--accent, #ef4444)', fontSize: '0.85rem' }}>{error}</p>}
      {msg && <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{msg}</p>}
      {text && <RichText text={text} />}
    </div>
  )
}
