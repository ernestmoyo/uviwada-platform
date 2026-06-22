/**
 * Branded Word (.docx) builder for UVIWATA lesson plans.
 *
 * Produces a Tanzania-themed, ministry-branded, editable document carrying the
 * Coat of Arms of the United Republic of Tanzania and the UVIWATA Mtoto Kwanza
 * logo, with the official curriculum attribution in the footer. Bilingual (SW/EN).
 *
 * Kept separate from the route handler so the document design lives in one place.
 */
import {
  AlignmentType, BorderStyle, Document, Footer, Header, ImageRun, PageNumber,
  Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType
} from 'docx'

import { tzCoatBuffer, uviwataLogoBuffer } from './brand-assets'
import type { LessonPlanStructured } from './curriculum'

// --- Tanzania + UVIWATA palette (hex, no #) ---
const NAVY = '14365C'   // UVIWATA deep blue (app brand)
const GREEN = '1EB53A'  // Tanzania flag green
const GOLD = 'FCD116'   // Tanzania flag gold
const BLUE = '00A3DD'   // Tanzania flag blue
const BLACK = '231F20'  // Tanzania flag black
const INK = '1F2937'
const MUTED = '6B7280'
const LIGHT = 'F3F6FA'

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }

type Labels = {
  obj: string; mat: string; intro: string; steps: string; assess: string; notes: string
  dur: string; min: string; ministry: string; country: string; curriculum: string
  prepared: string; source: string
}

function labels(lang: 'sw' | 'en'): Labels {
  return lang === 'en'
    ? {
        obj: 'Learning objectives', mat: 'Materials', intro: 'Introduction', steps: 'Activity steps',
        assess: 'Assessment', notes: 'Notes for the caregiver', dur: 'Duration', min: 'minutes',
        ministry: 'Ministry of Community Development, Gender, Women and Special Groups',
        country: 'United Republic of Tanzania',
        curriculum: 'Early Childhood Care, Development and Education Curriculum',
        prepared: 'Prepared with UVIWATA · Mtoto Kwanza',
        source: 'Adapted from the official National Curriculum for Early Childhood Care, Development and Education — Ministry of Community Development, Gender, Women and Special Groups · United Republic of Tanzania. Generated with UVIWATA Mtoto Kwanza.'
      }
    : {
        obj: 'Malengo ya somo', mat: 'Vifaa', intro: 'Utangulizi', steps: 'Hatua za shughuli',
        assess: 'Tathmini', notes: 'Maelezo kwa mlezi', dur: 'Muda', min: 'dakika',
        ministry: 'Wizara ya Maendeleo ya Jamii, Jinsia, Wanawake na Makundi Maalum',
        country: 'Jamhuri ya Muungano wa Tanzania',
        curriculum: 'Mtaala wa Malezi, Makuzi na Maendeleo ya Awali ya Mtoto',
        prepared: 'Imeandaliwa na UVIWATA · Mtoto Kwanza',
        source: 'Imetoholewa kutoka Mtaala rasmi wa Taifa wa Malezi, Makuzi na Maendeleo ya Awali ya Mtoto — Wizara ya Maendeleo ya Jamii, Jinsia, Wanawake na Makundi Maalum · Jamhuri ya Muungano wa Tanzania. Imeandaliwa kwa msaada wa UVIWATA Mtoto Kwanza.'
      }
}

// Branded header: Coat of Arms · ministry text · UVIWATA logo, with a green rule.
function buildHeader(L: Labels): Header {
  const coat = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new ImageRun({ type: 'png', data: tzCoatBuffer(), transformation: { width: 46, height: 53 } })]
  })
  const uviwata = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new ImageRun({ type: 'png', data: uviwataLogoBuffer(), transformation: { width: 92, height: 52 } })]
  })
  const centre = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: L.country.toUpperCase(), bold: true, size: 17, color: GREEN })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: L.ministry, size: 13, color: INK })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: L.curriculum, italics: true, size: 13, color: MUTED })] })
  ]

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    columnWidths: [1500, 6000, 1900],
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, borders: NO_BORDERS, children: [coat] }),
          new TableCell({ width: { size: 64, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, borders: NO_BORDERS, children: centre }),
          new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, borders: NO_BORDERS, children: [uviwata] })
        ]
      })
    ]
  })

  return new Header({
    children: [
      table,
      new Paragraph({ spacing: { before: 40, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 14, color: GREEN, space: 1 } }, children: [new TextRun({ text: '', size: 2 })] })
    ]
  })
}

function buildFooter(L: Labels): Footer {
  return new Footer({
    children: [
      new Paragraph({ spacing: { before: 0, after: 40 }, border: { top: { style: BorderStyle.SINGLE, size: 10, color: GOLD, space: 1 } }, children: [new TextRun({ text: '', size: 2 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: L.source, size: 12, color: MUTED, italics: true })] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: L.prepared + '   ·   ', size: 12, color: NAVY, bold: true }),
          new TextRun({ children: [PageNumber.CURRENT], size: 12, color: MUTED })
        ]
      })
    ]
  })
}

// Coloured section heading with a thin gold underline.
function heading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 90 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 3 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, color: NAVY })]
  })
}

function bullet(text: string): Paragraph {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text, size: 22, color: INK })] })
}

function body(text: string): Paragraph {
  return new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, size: 22, color: INK })] })
}

export function buildLessonDoc(p: LessonPlanStructured | null, raw: { title?: unknown; content?: unknown; lang?: unknown; created_at?: unknown }): Document {
  const lang = (raw.lang as string) === 'en' ? 'en' : 'sw'
  const L = labels(lang)
  const children: Paragraph[] = []

  const plan = p
  const title = plan?.title || String(raw.title || 'Lesson plan')

  // Title band — navy fill, white bold, gold accent underline.
  children.push(new Paragraph({
    spacing: { before: 80, after: 0 },
    shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: GOLD, space: 0 } },
    children: [new TextRun({ text: title, bold: true, size: 34, color: 'FFFFFF' })]
  }))

  // Meta strip — light fill chips (age band · theme · duration · date).
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
  children.push(new Paragraph({
    spacing: { before: 80, after: 120 },
    shading: { type: ShadingType.SOLID, color: LIGHT, fill: LIGHT },
    children: [new TextRun({ text: '  ' + metaBits.join('    ·    ') + '  ', size: 20, color: NAVY, bold: true })]
  }))

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
        new TextRun({ text: s.detail, size: 22, color: INK })
      ]
    })))
    children.push(heading(L.assess), body(plan.assessment))
    if (plan.notes) { children.push(heading(L.notes), body(plan.notes)) }
  } else {
    String(raw.content || '').split('\n').forEach((line) => children.push(body(line)))
  }

  return new Document({
    creator: 'UVIWATA Mtoto Kwanza',
    title: String(title),
    description: L.curriculum,
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{
      properties: { page: { margin: { top: 1700, bottom: 1300, left: 1100, right: 1100 } } },
      headers: { default: buildHeader(L) },
      footers: { default: buildFooter(L) },
      children
    }]
  })
}
