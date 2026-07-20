/**
 * Branded Word (.docx) builder for UVIWATA lesson plans.
 *
 * Tanzania-themed, ministry-branded, editable document carrying the Coat of
 * Arms + UVIWATA logo and the official curriculum attribution. Bilingual.
 * Shared branding (header/footer/palette/helpers) lives in ./brand-docx.
 */
import { Document } from 'docx'

import {
  GREEN, NAVY, brandLabels, brandHeader, brandFooter, titleBand, metaStrip, heading, bullet, body
} from './brand-docx'
import type { LessonPlanStructured } from './curriculum'
import { TextRun, Paragraph } from 'docx'

type LessonLabels = {
  obj: string; mat: string; intro: string; steps: string; assess: string; notes: string; dur: string; min: string
}

function lessonLabels(lang: 'sw' | 'en'): LessonLabels {
  return lang === 'en'
    ? { obj: 'Learning objectives', mat: 'Materials', intro: 'Introduction', steps: 'Activity steps', assess: 'Assessment', notes: 'Notes for the caregiver', dur: 'Duration', min: 'minutes' }
    : { obj: 'Malengo ya somo', mat: 'Vifaa', intro: 'Utangulizi', steps: 'Hatua za shughuli', assess: 'Tathmini', notes: 'Maelezo kwa mlezi', dur: 'Muda', min: 'dakika' }
}

export function buildLessonDoc(p: LessonPlanStructured | null, raw: { title?: unknown; content?: unknown; lang?: unknown; created_at?: unknown }): Document {
  const lang = (raw.lang as string) === 'en' ? 'en' : 'sw'
  const B = brandLabels(lang)
  const L = lessonLabels(lang)
  const children: Paragraph[] = []

  const plan = p
  const title = plan?.title || String(raw.title || 'Lesson plan')

  children.push(titleBand(title))

  const created = raw.created_at ? new Date(String(raw.created_at)) : null
  const dateStr = created && !isNaN(created.getTime())
    ? created.toLocaleDateString(lang === 'en' ? 'en-GB' : 'sw-TZ', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''
  const metaBits = [
    plan ? `${lang === 'en' ? 'Age' : 'Umri'} ${plan.age_band}` : '',
    plan?.theme ? `${lang === 'en' ? 'Theme' : 'Mada'}: ${plan.theme}` : '',
    plan?.duration_minutes ? `${L.dur} ${plan.duration_minutes} ${L.min}` : '',
    dateStr
  ].filter(Boolean)
  children.push(metaStrip(metaBits))

  if (plan) {
    children.push(heading(L.obj)); plan.objectives.forEach((o) => children.push(bullet(o)))
    children.push(heading(L.mat)); plan.materials.forEach((m) => children.push(bullet(m)))
    children.push(heading(L.intro), body(plan.introduction))
    children.push(heading(L.steps))
    plan.steps.forEach((s, i) => children.push(new Paragraph({
      spacing: { after: 70 },
      children: [
        new TextRun({ text: `${i + 1}.  `, bold: true, size: 22, color: GREEN }),
        new TextRun({ text: `${s.title}: `, bold: true, size: 22, color: NAVY }),
        new TextRun({ text: s.detail, size: 22, color: '1F2937' })
      ]
    })))
    children.push(heading(L.assess), body(plan.assessment))
    if (plan.notes) { children.push(heading(L.notes), body(plan.notes)) }
    // Printable teaching aids: one line of large emoji + labels per aid, so the
    // careworker can print the Word doc and cut the cards out.
    if (plan.visual_aids && plan.visual_aids.length) {
      children.push(heading(lang === 'en' ? 'Visual aids' : 'Vifaa vya kuona'))
      plan.visual_aids.forEach((a) => {
        children.push(new Paragraph({
          spacing: { before: 160, after: 40 },
          children: [new TextRun({ text: a.title, bold: true, size: 22, color: NAVY })]
        }))
        children.push(body(a.instruction))
        children.push(new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({
            text: a.items
              .map((i) => (a.type === 'counting'
                ? `${i.label}  ${i.emoji.repeat(Math.max(0, Math.min(10, parseInt(i.label, 10) || 0)))}`
                : `${i.emoji}  ${i.label}${i.group ? ` (${i.group})` : ''}`))
              .join('     '),
            size: 36
          })]
        }))
      })
    }
  } else {
    String(raw.content || '').split('\n').forEach((line) => children.push(body(line)))
  }

  return new Document({
    creator: 'UVIWATA Mtoto Kwanza',
    title: String(title),
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
