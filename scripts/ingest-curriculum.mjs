/**
 * Curriculum OCR ingestion: KADI MIAKA PDFs -> structured bilingual cards.
 *
 * Renders each PDF page to a downscaled JPEG (mupdf WASM, no native deps), sends
 * page batches to Claude vision, and extracts activity "cards" (subject, title,
 * about, materials, steps) in Kiswahili + English. Resumable: results are
 * checkpointed per batch to a .jsonl; re-running skips completed batches.
 *
 * Usage (from demo/):
 *   node scripts/ingest-curriculum.mjs --pdf "../KADI MIAKA 2-3.pdf" --age 2-3 [--pages 1:30] [--batch 3] [--model claude-sonnet-4-6]
 *   node scripts/ingest-curriculum.mjs --build           # aggregate all *.jsonl -> curriculum.json
 *
 * Key: reads ANTHROPIC_API_KEY from demo/.env.local (or the environment).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as mupdf from 'mupdf'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEMO = path.resolve(__dirname, '..')
const OUTDIR = path.join(DEMO, 'scripts', 'curriculum-ocr')
fs.mkdirSync(OUTDIR, { recursive: true })

// ---- args ----
const args = process.argv.slice(2)
const arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d }
const has = (k) => args.includes('--' + k)

// ---- env: load ANTHROPIC_API_KEY from .env.local ----
function loadEnv() {
  if (process.env.ANTHROPIC_API_KEY) return
  try {
    const txt = fs.readFileSync(path.join(DEMO, '.env.local'), 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.+)\s*$/)
      if (m) process.env.ANTHROPIC_API_KEY = m[1].trim()
    }
  } catch {}
}

const MODEL = arg('model', process.env.ANTHROPIC_INGEST_MODEL || 'claude-sonnet-4-6')
const MAX_W = 1100 // downscale long edge to control vision tokens

const SYSTEM = [
  'You extract activity cards from the official Tanzanian NECDP daycare curriculum (KIONGOZI CHA MLEZI).',
  'The document mixes narrative chapters with practical "activity cards" that have a title and sections like purpose/about, materials (vifaa), and steps (hatua/utaratibu).',
  'From the page image(s), extract ONLY genuine activity/learning cards. Skip cover pages, tables of contents, and pure narrative/policy prose (return an empty array for those).',
  'Source text is Kiswahili. For each card provide the Kiswahili fields AND an accurate English translation.',
  'Return STRICT JSON only, no prose.'
].join(' ')

const SCHEMA_HINT = `Return JSON: {"cards":[{
  "subject": "<area/theme in Kiswahili, or null>",
  "title_sw": "<card title in Kiswahili>",
  "title_en": "<English translation>",
  "about_sw": "<purpose/what it's about, Kiswahili, or null>",
  "about_en": "<English>",
  "materials_sw": "<materials, Kiswahili, or null>",
  "materials_en": "<English>",
  "steps_sw": "<steps as a single newline-separated string, Kiswahili, or null>",
  "steps_en": "<English>",
  "source_page": <page number int>
}]}`

function renderPage(doc, n) {
  const page = doc.loadPage(n)
  const bounds = page.getBounds()
  const w = bounds[2] - bounds[0]
  const scale = Math.min(MAX_W / w, 200 / 72)
  const pix = page.toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false, true)
  return Buffer.from(pix.asJPEG(70))
}

async function extractBatch(client, images) {
  const content = []
  for (const im of images) {
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: im.b64 } })
    content.push({ type: 'text', text: `(above image is page ${im.page})` })
  }
  content.push({ type: 'text', text: SCHEMA_HINT })
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: 'user', content }]
  })
  const text = (msg.content.find((b) => b.type === 'text') || {}).text || '{"cards":[]}'
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  let parsed
  try { parsed = JSON.parse(json) } catch { parsed = { cards: [], _parse_error: text.slice(0, 200) } }
  return { cards: parsed.cards || [], usage: msg.usage }
}

async function ingest() {
  loadEnv()
  if (!process.env.ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY not set (add it to demo/.env.local)'); process.exit(1) }
  const pdfPath = arg('pdf')
  const age = arg('age')
  if (!pdfPath || !age) { console.error('need --pdf and --age'); process.exit(1) }
  const batch = parseInt(arg('batch', '3'), 10)
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const buf = fs.readFileSync(path.resolve(DEMO, pdfPath))
  const doc = mupdf.Document.openDocument(buf, 'application/pdf')
  const total = doc.countPages()
  const range = arg('pages')
  let start = 1, end = total
  if (range) { const [a, b] = range.split(':').map(Number); start = a || 1; end = b || total }

  const ckptFile = path.join(OUTDIR, `age-${age}.jsonl`)
  const done = new Set()
  if (fs.existsSync(ckptFile)) {
    for (const line of fs.readFileSync(ckptFile, 'utf8').split(/\r?\n/).filter(Boolean)) {
      try { done.add(JSON.parse(line).batchStart) } catch {}
    }
  }
  console.log(`PDF ${pdfPath} (${total}p) age ${age} | pages ${start}-${end} | batch ${batch} | model ${MODEL}`)

  let inTok = 0, outTok = 0, cardCount = 0
  for (let p = start; p <= end; p += batch) {
    if (done.has(p)) { continue }
    const images = []
    for (let q = p; q < p + batch && q <= end; q++) {
      images.push({ page: q, b64: renderPage(doc, q - 1).toString('base64') })
    }
    try {
      const r = await extractBatch(client, images)
      inTok += r.usage?.input_tokens || 0; outTok += r.usage?.output_tokens || 0
      const cards = r.cards.map((c) => ({ ...c, age_band: age, source_pdf: path.basename(pdfPath) }))
      cardCount += cards.length
      fs.appendFileSync(ckptFile, JSON.stringify({ batchStart: p, pages: images.map((i) => i.page), cards }) + '\n')
      process.stdout.write(`  pages ${p}-${images[images.length - 1].page}: ${cards.length} cards (tok in ${inTok} out ${outTok})\n`)
    } catch (e) {
      console.error(`  pages ${p}+: ERROR ${e.message}`)
      fs.appendFileSync(ckptFile, JSON.stringify({ batchStart: p, pages: images.map((i) => i.page), cards: [], error: String(e.message) }) + '\n')
    }
  }
  console.log(`DONE age ${age}: ~${cardCount} cards. tokens in=${inTok} out=${outTok}. Checkpoint: ${ckptFile}`)
}

function build() {
  const out = []
  let sort = 0
  for (const f of fs.readdirSync(OUTDIR).filter((f) => f.endsWith('.jsonl')).sort()) {
    for (const line of fs.readFileSync(path.join(OUTDIR, f), 'utf8').split(/\r?\n/).filter(Boolean)) {
      const rec = JSON.parse(line)
      for (const c of rec.cards || []) {
        if (!c.title_sw) continue
        out.push({
          age_band: c.age_band, subject: c.subject || null,
          title_sw: c.title_sw, title_en: c.title_en || null,
          about_sw: c.about_sw || null, about_en: c.about_en || null,
          materials_sw: c.materials_sw || null, materials_en: c.materials_en || null,
          steps_sw: c.steps_sw || null, steps_en: c.steps_en || null,
          source_pdf: c.source_pdf || null, source_page: c.source_page || null,
          sort_order: sort++
        })
      }
    }
  }
  const dest = path.join(DEMO, 'curriculum.json')
  fs.writeFileSync(dest, JSON.stringify(out, null, 2))
  console.log(`Wrote ${out.length} cards -> ${dest}`)
}

if (has('build')) build()
else ingest()
