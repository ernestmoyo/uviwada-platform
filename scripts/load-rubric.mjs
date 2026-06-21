// load-rubric.mjs — load the real DCC rubric records into Supabase.
//
// SAFETY: dry-run by default. It ALWAYS writes a backup first and NEVER mutates
// unless you pass --apply. Demo-seed deletion is scoped to the 35 KNOWN seed
// UUIDs only (never `dcc_uid is null`, never a blanket truncate) — so real
// centres that self-registered through the platform (which also have a null
// dcc_uid) are NEVER deleted. Idempotent: re-running --apply upserts.
//
// If any self-registered members exist (dcc_uid null AND not a known demo seed),
// --apply ABORTS and lists them, unless you explicitly pass --allow-registrations
// to confirm you have reviewed them. The import never deletes them either way.
//
//   node scripts/load-rubric.mjs                         # dry run + backup, no writes
//   node scripts/load-rubric.mjs --apply                 # backup → delete 35 demo seeds → load
//   node scripts/load-rubric.mjs --apply --allow-registrations  # proceed despite real registrations
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
const ALLOW_REG = process.argv.includes('--allow-registrations')

// Populated by preflight(): members with a null dcc_uid that are NOT known demo
// seeds — i.e. real or test self-registrations. The loader must never delete these.
let REGISTRATIONS = []
// Whether members.region exists (migration 0008). Region always goes into
// rubric_assessments.raw (so the public Province/Region filter works regardless);
// it is written to members.region only when the column is present.
let HAS_REGION = false

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
// New full clean dataset (243 centres). The records carry 0–1 scores + a `tier`
// and per-domain objects; the platform expects 0–100 `infra_score`/`capacity_score`,
// an `infra_result` (1–4) and `infra_tier`, read out of `rubric_assessments.raw`.
// We normalise to the platform shape here so the app + rawToCentre work unchanged.
const records = JSON.parse(readFileSync(resolve(ROOT, 'analysis', 'data', 'records.clean.json'), 'utf8'))
// No submission_uuid in this export — dcc_uid is unique per centre, use it as the key.
for (const r of records) r.submission_uuid = r.submission_uuid || r.dcc_uid
console.log(`records to load: ${records.length}`)

const meanInfra = (infra) => {
  const xs = Object.values(infra || {}).filter((v) => Number.isFinite(v))
  return xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : null
}
const PATHWAY = {
  'Level 4': 'Standard pathway: centre may be considered for full registration',
  'Level 3': 'Centre may qualify for operational recognition with continued improvement',
  'Level 2': 'Centre may be considered for provisional recognition or conditional support',
  'Level 1': 'Foundational support: safety basics and registration onboarding first'
}
// Build the platform-shaped `raw` (0–100 scores, infra_score/result/tier) consumed by rawToCentre.
function platformRaw(r) {
  const infraResult = meanInfra(r.infra)
  return {
    ...r,
    region: r.region ?? 'Dar es Salaam',
    capacity_score: r.capacity_score == null ? null : Math.round(r.capacity_score * 100),
    capacity_result: r.capacity_result,
    infra_result: infraResult,
    infra_score: r.overall_score == null ? null : Math.round(r.overall_score * 100),
    infra_weighted: r.overall_score == null ? null : Math.round(r.overall_score * 100),
    infra_tier: r.tier,
    formalization_pathway: PATHWAY[r.tier] ?? null
  }
}

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
  // members.region (0008) is optional — degrade gracefully if absent.
  const regionProbe = await sb.from('members').select('region').limit(1)
  HAS_REGION = !regionProbe.error
  console.log('schema probe: rubric tables + member columns present ✓')
  console.log(HAS_REGION
    ? 'members.region present ✓ (region written to members + raw)'
    : '⚠ members.region NOT present — region written to rubric_assessments.raw only. Apply 0008 + re-run to populate members.region (admin table filter).')

  // Protect real self-registrations: members with null dcc_uid that are NOT
  // known demo seeds. These came in through the platform register flow and must
  // never be deleted by this loader.
  const { data: nullUid, error: regErr } = await sb
    .from('members')
    .select('id, centre_name, owner_user_id, is_demo, created_at')
    .is('dcc_uid', null)
  if (regErr) { console.warn(`  registration probe failed: ${regErr.message}`); return true }
  const seedSet = new Set(DEMO_SEED_IDS)
  REGISTRATIONS = (nullUid ?? []).filter((m) => !seedSet.has(m.id))
  if (REGISTRATIONS.length) {
    console.log(`\n⚠ ${REGISTRATIONS.length} self-registered member(s) detected (null dcc_uid, not a demo seed):`)
    for (const m of REGISTRATIONS) {
      console.log(`   - ${m.centre_name}  (id=${m.id}, owner_user_id=${m.owner_user_id ?? 'none'}, is_demo=${m.is_demo})`)
    }
    console.log('   These will NOT be deleted. Pass --allow-registrations to run --apply alongside them.')
  } else {
    console.log('no self-registered members found (only known demo seeds carry a null dcc_uid).')
  }
  return true
}

// ---- transform a record into rows -------------------------------------------
function memberRow(r) {
  return {
    org_id: ORG_DAR,
    dcc_uid: r.dcc_uid,
    centre_name: r.name,
    ...(HAS_REGION ? { region: r.region ?? 'Dar es Salaam' } : {}),
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
    latest_quality: tierToTraffic(r.tier),
    is_demo: false
  }
}

async function apply() {
  // 0. refuse to proceed if real registrations exist and were not acknowledged.
  if (REGISTRATIONS.length && !ALLOW_REG) {
    throw new Error(
      `${REGISTRATIONS.length} self-registered member(s) present. Review the list above, then ` +
      `re-run with --apply --allow-registrations to confirm. (They will not be deleted.)`
    )
  }

  // 1. backup
  await backup()

  // 2. remove ONLY the 35 known demo seed members (scoped by exact UUID).
  //    We deliberately do NOT delete `dcc_uid is null`, because real centres that
  //    self-registered through the platform also have a null dcc_uid and must be
  //    preserved. The dcc_uid-keyed import below never touches registration rows.
  const { data: toDelete } = await sb
    .from('members')
    .select('id, centre_name')
    .in('id', DEMO_SEED_IDS)
  const list = toDelete ?? []
  console.log(`demo seed members to remove (of 35 known): ${list.length}`)
  for (const m of list) console.log(`   - ${m.centre_name}`)
  if (list.length) {
    const { error } = await sb.from('members').delete().in('id', DEMO_SEED_IDS)
    if (error) throw new Error('demo-seed cleanup failed: ' + error.message)
    console.log(`deleted ${list.length} demo seed members (cascaded their assessments).`)
  } else {
    console.log('no demo seed members to delete.')
  }
  if (REGISTRATIONS.length) {
    console.log(`preserved ${REGISTRATIONS.length} self-registered member(s) (--allow-registrations).`)
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

  const assessRows = records.map((r) => {
    const pr = platformRaw(r) // 0–100 scores, infra_result/tier/pathway
    return {
    member_id: idByUid[r.dcc_uid],
    submission_uuid: r.submission_uuid,
    assessment_type: r.assessment_type,
    assessed_on: r.assessed_on,
    gps_lat: r.lat,
    gps_lng: r.lng,
    capacity_result: pr.capacity_result,
    capacity_score: pr.capacity_score,
    infra_result: pr.infra_result,
    infra_score: pr.infra_score,
    infra_weighted: pr.infra_weighted,
    infra_tier: pr.infra_tier,
    formalization_pathway: pr.formalization_pathway,
    assessor_comments: r.assessor_comments,
    source: 'import',
    raw: pr
    }
  }).filter((a) => a.member_id)

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
  const n = records.length
  console.log(`\nWould: delete up to 35 demo seeds, upsert ${n} members, insert ${n} rubric assessments + ~${n * 27} domain rows.`)
  if (REGISTRATIONS.length) {
    console.log(`Would ABORT on --apply (without --allow-registrations): ${REGISTRATIONS.length} self-registered member(s) present (see list above).`)
  }
} else {
  console.log('\n--apply: performing backup → delete demo seeds → load …')
  await apply()
}
