/**
 * Branded Word (.docx) builder for AI quality-improvement recommendations.
 *
 * Uses the shared Tanzania + UVIWATA branding (./brand-docx) and renders the
 * AI's markdown-ish recommendation text into clean, styled paragraphs.
 */
import { Document, Paragraph, TextRun } from 'docx'

import { INK, NAVY, GREEN, brandLabels, brandHeader, brandFooter, titleBand, metaStrip, heading } from './brand-docx'

// Render inline **bold** markers within a line into TextRuns.
function inlineRuns(text: string, color = INK, size = 22): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== '')
  if (parts.length === 0) return [new TextRun({ text, size, color })]
  return parts.map((p) => {
    const m = p.match(/^\*\*([^*]+)\*\*$/)
    return m
      ? new TextRun({ text: m[1], bold: true, size, color: NAVY })
      : new TextRun({ text: p, size, color })
  })
}

// Parse the AI text (headings #, bullets -/*/•, numbered 1., bold **) into paragraphs.
function renderText(text: string): Paragraph[] {
  const out: Paragraph[] = []
  const lines = String(text || '').replace(/\r/g, '').split('\n')
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) { out.push(heading(h[2].replace(/\*\*/g, ''))); continue }
    const b = line.match(/^[-*•]\s+(.*)$/)
    if (b) { out.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: inlineRuns(b[1]) })); continue }
    const n = line.match(/^(\d+)[.)]\s+(.*)$/)
    if (n) {
      out.push(new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun({ text: `${n[1]}.  `, bold: true, size: 22, color: GREEN }), ...inlineRuns(n[2])]
      }))
      continue
    }
    out.push(new Paragraph({ spacing: { after: 80 }, children: inlineRuns(line) }))
  }
  if (out.length === 0) out.push(new Paragraph({ children: [new TextRun({ text: '—', size: 22, color: INK })] }))
  return out
}

export function buildRecommendationsDoc(opts: { text: string; centreName?: string; lang?: string; date?: Date }): Document {
  const lang = opts.lang === 'en' ? 'en' : 'sw'
  const B = brandLabels(lang)
  const heading1 = lang === 'en' ? 'Areas to Improve' : 'Maeneo ya Kuboresha'
  const title = opts.centreName ? `${heading1} — ${opts.centreName}` : heading1

  const date = opts.date && !isNaN(opts.date.getTime()) ? opts.date : null
  const dateStr = date ? date.toLocaleDateString(lang === 'en' ? 'en-GB' : 'sw-TZ', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
  const intro = lang === 'en'
    ? 'AI-assisted suggestions from the centre\'s most recent quality assessment. Progressive guidance — focus on the next level up.'
    : 'Mapendekezo kwa msaada wa AI kutoka tathmini ya hivi karibuni ya ubora. Mwongozo wa hatua kwa hatua — lenga ngazi inayofuata.'

  const children: Paragraph[] = [titleBand(title)]
  children.push(metaStrip([lang === 'en' ? 'Quality improvement' : 'Uboreshaji wa ubora', dateStr].filter(Boolean)))
  children.push(new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: intro, italics: true, size: 20, color: '6B7280' })] }))
  children.push(...renderText(opts.text))

  return new Document({
    creator: 'UVIWATA Mtoto Kwanza',
    title,
    description: B.curriculum,
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{
      properties: { page: { margin: { top: 1700, bottom: 1300, left: 1100, right: 1100 } } },
      headers: { default: brandHeader(B) },
      footers: { default: brandFooter(B) },
      children
    }]
  })
}
