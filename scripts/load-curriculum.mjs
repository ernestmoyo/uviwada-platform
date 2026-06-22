/**
 * Load curriculum.json -> Supabase curriculum_items.
 * Requires migration 0009_curriculum.sql applied first.
 *
 * Usage (from demo/):
 *   node scripts/load-curriculum.mjs            # dry run (counts only)
 *   node scripts/load-curriculum.mjs --apply    # insert rows
 *   node scripts/load-curriculum.mjs --apply --clear   # delete existing, then insert
 *
 * Reads Supabase URL + service-role key from demo/.env.local. NOTE: that file
 * may point at PRODUCTION Supabase — review before --apply.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEMO = path.resolve(__dirname, '..')
const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const CLEAR = args.includes('--clear')

const env = Object.fromEntries(
  fs.readFileSync(path.join(DEMO, '.env.local'), 'utf8')
    .split(/\r?\n/).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const url = env.NEXT_PUBLIC_SUPABASE_URL
const host = (() => { try { return new URL(url).host } catch { return url } })()

const cards = JSON.parse(fs.readFileSync(path.join(DEMO, 'curriculum.json'), 'utf8'))
const byBand = cards.reduce((m, c) => { m[c.age_band] = (m[c.age_band] || 0) + 1; return m }, {})
console.log(`curriculum.json: ${cards.length} cards`, byBand)
console.log(`Supabase host: ${host}`)
if (!APPLY) { console.log('DRY RUN. Re-run with --apply to insert.'); process.exit(0) }

const sb = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

if (CLEAR) {
  const { error } = await sb.from('curriculum_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log('cleared existing:', error ? error.message : 'ok')
}

let inserted = 0
for (let i = 0; i < cards.length; i += 200) {
  const batch = cards.slice(i, i + 200)
  const { error } = await sb.from('curriculum_items').insert(batch)
  if (error) { console.error('insert error at', i, error.message); process.exit(1) }
  inserted += batch.length
  process.stdout.write(`  inserted ${inserted}/${cards.length}\n`)
}
console.log('DONE. Loaded', inserted, 'curriculum cards.')
