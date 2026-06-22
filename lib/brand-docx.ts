/**
 * Shared Tanzania + UVIWATA branding for generated Word (.docx) documents.
 *
 * Holds the palette, the ministry/Coat-of-Arms header, the Government
 * attribution footer, and the common section/title/meta paragraph helpers so
 * every branded document (lesson plans, improvement recommendations, …) looks
 * identical. Bilingual (SW/EN).
 */
import {
  AlignmentType, BorderStyle, Footer, Header, ImageRun, PageNumber,
  Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType
} from 'docx'

import { tzCoatBuffer, uviwataLogoBuffer } from './brand-assets'

// --- Tanzania + UVIWATA palette (hex, no #) ---
export const NAVY = '14365C'   // UVIWATA deep blue (app brand)
export const GREEN = '1EB53A'  // Tanzania flag green
export const GOLD = 'FCD116'   // Tanzania flag gold
export const BLUE = '00A3DD'   // Tanzania flag blue
export const BLACK = '231F20'  // Tanzania flag black
export const INK = '1F2937'
export const MUTED = '6B7280'
export const LIGHT = 'F3F6FA'

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }

export interface BrandLabels {
  ministry: string
  country: string
  curriculum: string
  prepared: string
  source: string
}

export function brandLabels(lang: 'sw' | 'en'): BrandLabels {
  return lang === 'en'
    ? {
        ministry: 'Ministry of Community Development, Gender, Women and Special Groups',
        country: 'United Republic of Tanzania',
        curriculum: 'Early Childhood Care, Development and Education',
        prepared: 'Prepared with UVIWATA · Mtoto Kwanza',
        source: 'Government of the United Republic of Tanzania — Ministry of Community Development, Gender, Women and Special Groups. Generated with UVIWATA Mtoto Kwanza.'
      }
    : {
        ministry: 'Wizara ya Maendeleo ya Jamii, Jinsia, Wanawake na Makundi Maalum',
        country: 'Jamhuri ya Muungano wa Tanzania',
        curriculum: 'Malezi, Makuzi na Maendeleo ya Awali ya Mtoto',
        prepared: 'Imeandaliwa na UVIWATA · Mtoto Kwanza',
        source: 'Serikali ya Jamhuri ya Muungano wa Tanzania — Wizara ya Maendeleo ya Jamii, Jinsia, Wanawake na Makundi Maalum. Imeandaliwa kwa msaada wa UVIWATA Mtoto Kwanza.'
      }
}

// Branded header: Coat of Arms · ministry text · UVIWATA logo, with a green rule.
export function brandHeader(L: BrandLabels): Header {
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

export function brandFooter(L: BrandLabels): Footer {
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

// Navy title band with a gold accent underline.
export function titleBand(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 80, after: 0 },
    shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: GOLD, space: 0 } },
    children: [new TextRun({ text: title, bold: true, size: 34, color: 'FFFFFF' })]
  })
}

// Light meta strip (age band · theme · date …).
export function metaStrip(bits: string[]): Paragraph {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    shading: { type: ShadingType.SOLID, color: LIGHT, fill: LIGHT },
    children: [new TextRun({ text: '  ' + bits.join('    ·    ') + '  ', size: 20, color: NAVY, bold: true })]
  })
}

// Coloured section heading with a thin gold underline.
export function heading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 90 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 3 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, color: NAVY })]
  })
}

export function bullet(text: string): Paragraph {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text, size: 22, color: INK })] })
}

export function body(text: string): Paragraph {
  return new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, size: 22, color: INK })] })
}
