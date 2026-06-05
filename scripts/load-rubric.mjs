// load-rubric.mjs — load the 234 real DCC rubric records into Supabase.
//
// SAFETY: dry-run by default. It ALWAYS writes a backup first and NEVER mutates
// unless you pass --apply. Demo-seed deletion is scoped to the 35 known seed
// UUIDs (never a blanket truncate). Idempotent: re-running --apply upserts.
//
//   node scripts/load-rubric.mjs            # dry run + backup, no writes
//   node scripts/load-rubric.mjs --apply    # backup → delete 35 demo seeds → load 234
//
// Run from the demo/ directory (resolves @supabase/supabase-js).

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEMO = resolve(__dirname, '..')
const ROOT = resolve(DEMO, '..')
const APPLY = process.argv.includes('--apply')

// ---- env (parse .env.local without printing secrets) ------------------------
function loadEnv() {
  const p = resolve(DEMO, '.env.local')
  if (!existsSync(p)) throw new Error('demo/.env.local not found')
  const env = {}
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}
const env = loadEnv()
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local')
const sb = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })

// ---- rubric label maps (kept in sync with lib/rubric.ts) --------------------
const CAP = {
  cap01: 'Understanding & assessing child development milestones',
  cap02: 'Responsive communication & language development',
  cap03: 'Child-centred & play-based learning facilitation',
  cap04: 'Peer learning & social-emotional development support',
  cap05: 'Supporting individual child needs & inclusion',
  cap06: 'Organising learning environment & resource development',
  cap07: 'Facilitating experiential learning',
  cap08: 'Family & parent engagement',
  cap09: 'Observation, documentation & child progress monitoring',
  cap10: 'Care for individual child psychosocial needs',
  cap11: 'Child protection, safety & wellbeing',
  cap12: 'Supporting children with disabilities / special needs',
  cap13: 'Reflective practice & continuous improvement'
}
const INF = {
  location: 'Location & surrounding safety',
  building: 'Building structure, ventilation & lighting',
  office: 'Office space',
  indoor: 'Indoor space, facilities & equipment',
  outdoor: 'Outdoor space, facilities & equipment',
  materials: 'Play & learning materials',
  fencing: 'Fence / enclosure & access control',
  sleeping: "Children's day sleeping facilities",
  records: 'Record keeping, privacy & confidentiality',
  furniture: 'Furniture & surroundings',
  toilets: 'Toilets & sanitation',
  water: 'Safe & clean water',
  safety: 'Safety & security',
  nutrition: 'Food hygiene & nutrition'
}

const ORG_DAR = '00000000-0000-0000-0000-000000000011'

// 35 known demo-seed centre UUIDs (from seed.sql): 201–224, 301–306, 401–405.
const DEMO_SEED_IDS = [
  ...range(201, 224), ...range(301, 306), ...range(401, 405)
].map((n) => '00000000-0000-0000-0000-' + String(n).padStart(12, '0'))
function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r }

const tierToTraffic = (t) => (!t ? 'amber' : t.includes('Level 4') ? 'green' : t.includes('Level 3') ? 'amber' : 'red')
const licenseFromReg = (s) =>
  !s ? 'not_applied' : /^Registered/i.test(s) ? 'fully_licensed' : /provisional/i.test(s) ? 'pending' : 'not_applied'

// ---- load records -----------------------------------------------------------
const records = JSON.parse(readFileSync(resolve(ROOT, 'upgrade', 'analysis', 'data', 'records.clean.json'), 'utf8'))
console.log(`records to load: ${records.length}`)

// ---- backup -----------------------------------------------------------------
async function dumpAll(table, cols = '*') {
  const { data, error } = await sb.from(table).select(cols)
  if (error) { console.warn(`  backup ${table}: ${error.message}`); return [] }
  return data ?? []
}
async function backup() {
  const dir = resolve(ROOT, 'upgrade', 'analysis', 'backups')
  mkdirSync(dir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const snap = {
    at: stamp,
    members: await dumpAll('members'),
    assessments: await dumpAll('assessments'),
    quality_indicator_scores: await dumpAll('quality_indicator_scores'),
    rubric_assessments: await dumpAll('rubric_assessments'),
    rubric_domain_scores: await dumpAll('rubric_domain_scores')
  }
  const file = resolve(dir, `backup-${stamp}.json`)
  writeFileSync(file, JSON.stringify(snap, null, 2))
  console.log(`backup written → ${file}`)
  console.log(`  members=${snap.members.length} assessments=${snap.assessments.length} rubric_assessments=${snap.rubric_assessments.length}`)
  return snap
}

// ---- preflight (read-only) --------------------------------------------------
async function preflight() {
  const { count: memberCount } = await sb.from('members').select('id', { count: 'exact', head: true })
  const { data: seeds } = await sb.from('members').select('id').in('id', DEMO_SEED_IDS)
  console.log(`current members in DB: ${memberCount}`)
  console.log(`demo seeds present (of 35 known): ${(seeds ?? []).length}`)
  // schema probe: real select so a missing table surfaces as an error
  const probe = await sb.from('rubric_assessments').select('id').limit(1)
  const probe2 = await sb.from('members').select('dcc_uid').limit(1)
  if (probe.error || probe2.error) {
    console.error(`\n!! rubric schema not found — apply supabase/migrations/0004_rubric.sql in the Supabase SQL Editor first.`)
    if (probe.error) console.error(`   rubric_assessments: ${probe.error.message}`)
    if (probe2.error) console.error(`   members.dcc_uid: ${probe2.error.message}`)
    return false
  }
  console.log('schema probe: rubric tables + member columns present ✓')
  return true
}

// ---- transform a record into rows -------------------------------------------
function memberRow(r) {
  return {
    org_id: ORG_DAR,
    dcc_uid: r.dcc_uid,
    centre_name: r.name,
    ward: r.ward ?? 'Unknown',
    district: r.council ?? 'Dar es Salaam',
    council: r.council,
    mtaa: r.mtaa,
    lat: r.lat,
    lng: r.lng,
    phone: '', // not collected in the rubric export
    year_founded: r.establishment_year,
    children_count: r.children_total ?? 0,
    caregiver_count: r.staff_total ?? r.careworkers_on_duty ?? 0,
    girls_enrolled: r.girls,
    boys_enrolled: r.boys,
    disability_count: r.disability_count,
    avg_daily_attendance: r.avg_attendance,
    female_staff: r.female_staff,
    male_staff: r.male_staff,
    careworker_ratio: r.careworker_ratio,
    monthly_fee: r.monthly_fee,
    daily_meal_fee: r.daily_meal_fee,
    owner_sex: r.owner_sex,
    manager_sex: r.manager_sex,
    ownership_type: r.ownership_type,
    registration_status_detail: r.registration_status,
    license_status: licenseFromReg(r.registration_status),
    latest_quality: tierToTraffic(r.infra_tier),
    is_demo: false
  }
}

async function apply() {
  // 1. backup
  await backup()

  // 2. remove all current demo/test members for a clean 234.
  //    Real imported centres are the only rows that carry a dcc_uid, so deleting
  //    `dcc_uid is null` removes the 35 seeds + the ~9 demo registrations in one
  //    scoped, idempotent predicate (re-running never touches the loaded 234).
  const { data: toDelete } = await sb.from('members').select('id, centre_name, dcc_uid').is('dcc_uid', null)
  const list = toDelete ?? []
  console.log(`members to remove (no dcc_uid): ${list.length}`)
  for (const m of list) console.log(`   - ${m.centre_name}`)
  if (list.length) {
    const { error } = await sb.from('members').delete().is('dcc_uid', null)
    if (error) throw new Error('member cleanup failed: ' + error.message)
    console.log(`deleted ${list.length} demo/test members (cascaded their assessments).`)
  } else {
    console.log('no demo/test members to delete.')
  }

  // 3. insert members. Idempotent without ON CONFLICT (the dcc_uid unique index
  //    is partial, which ON CONFLICT can't target): clear any prior import of the
  //    same dcc_uids first, then insert fresh.
  const uids = records.map((r) => r.dcc_uid).filter(Boolean)
  for (const chunk of chunks(uids, 200)) await sb.from('members').delete().in('dcc_uid', chunk)
  const rows = records.map(memberRow)
  const idByUid = {}
  for (const chunk of chunks(rows, 200)) {
    const { data, error } = await sb.from('members').insert(chunk).select('id, dcc_uid')
    if (error) throw new Error('member insert failed: ' + error.message)
    for (const m of data) idByUid[m.dcc_uid] = m.id
  }
  console.log(`inserted ${Object.keys(idByUid).length} members.`)

  // 4. reset rubric assessments for these submissions (idempotent), then insert
  const subs = records.map((r) => r.submission_uuid).filter(Boolean)
  for (const chunk of chunks(subs, 200)) {
    await sb.from('rubric_assessments').delete().in('submission_uuid', chunk)
  }

  const assessRows = records.map((r) => ({
    member_id: idByUid[r.dcc_uid],
    submission_uuid: r.submission_uuid,
    assessment_type: r.assessment_type,
    assessed_on: r.assessed_on,
    gps_lat: r.lat,
    gps_lng: r.lng,
    capacity_result: r.capacity_result,
    capacity_score: r.capacity_score,
    infra_result: r.infra_result,
    infra_score: r.infra_score,
    infra_weighted: r.infra_weighted,
    infra_tier: r.infra_tier,
    formalization_pathway: r.formalization_pathway,
    assessor_comments: r.assessor_comments,
    source: 'import',
    raw: r
  })).filter((a) => a.member_id)

  const assessIdBySub = {}
  for (const chunk of chunks(assessRows, 150)) {
    const { data, error } = await sb.from('rubric_assessments').insert(chunk).select('id, submission_uuid')
    if (error) throw new Error('rubric_assessments insert failed: ' + error.message)
    for (const a of data) assessIdBySub[a.submission_uuid] = a.id
  }
  console.log(`inserted ${Object.keys(assessIdBySub).length} rubric assessments.`)

  // 5. per-domain scores (13 capacity + 14 infra per assessment)
  const domainRows = []
  for (const r of records) {
    const aid = assessIdBySub[r.submission_uuid]
    if (!aid) continue
    for (const [k, label] of Object.entries(CAP)) {
      domainRows.push({ assessment_id: aid, kind: 'capacity', domain_key: k, domain_label: label, level: r.capacity?.[k] ?? null })
    }
    for (const [k, label] of Object.entries(INF)) {
      domainRows.push({ assessment_id: aid, kind: 'infra', domain_key: k, domain_label: label, level: r.infra?.[k] ?? null })
    }
  }
  let n = 0
  for (const chunk of chunks(domainRows, 500)) {
    const { error } = await sb.from('rubric_domain_scores').insert(chunk)
    if (error) throw new Error('rubric_domain_scores insert failed: ' + error.message)
    n += chunk.length
  }
  console.log(`inserted ${n} domain score rows.`)

  // 6. verify
  const { count: finalMembers } = await sb.from('members').select('id', { count: 'exact', head: true })
  const { count: finalAssess } = await sb.from('rubric_assessments').select('id', { count: 'exact', head: true })
  console.log(`\nDONE. members=${finalMembers} rubric_assessments=${finalAssess}`)
}

function* chunks(arr, size) { for (let i = 0; i < arr.length; i += size) yield arr.slice(i, i + size) }

// ---- main -------------------------------------------------------------------
const ok = await preflight()
if (!ok) process.exit(1)
if (!APPLY) {
  console.log('\nDRY RUN — writing backup only, no mutations. Re-run with --apply to load.')
  await backup()
  console.log('\nWould: delete up to 35 demo seeds, upsert 234 members, insert 234 rubric assessments + ~6,318 domain rows.')
} else {
  console.log('\n--apply: performing backup → delete demo seeds → load …')
  await apply()
}
