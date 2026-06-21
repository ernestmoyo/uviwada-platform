/* Safe, DB-free integration test for the field-sync core.
   Run: node --experimental-strip-types lib/field-sync.test.ts
   Uses an in-memory fake Supabase + a stub rubric mirroring lib/rubric — no DB. */

import { processSyncBatch, type SupabaseLike, type RubricCtx } from './field-sync.ts'

// ----- in-memory fake supabase -----
function makeFakeDb() {
  const store: Record<string, any[]> = { rubric_assessments: [], rubric_domain_scores: [], app_users: [], members: [] }
  let seq = 0
  const nextId = () => '00000000-0000-4000-8000-' + String(++seq).padStart(12, '0')
  function from(table: string) {
    store[table] = store[table] || []
    const rows = store[table]
    return {
      select(_cols: string) {
        const filters: Array<[string, unknown]> = []
        const api: any = {
          eq(col: string, val: unknown) { filters.push([col, val]); return api },
          async maybeSingle() { const hit = rows.find((r) => filters.every(([c, v]) => r[c] === v)); return { data: hit ? { id: hit.id } : null, error: null } }
        }
        return api
      },
      insert(payload: unknown) {
        const list = Array.isArray(payload) ? payload : [payload]
        list.forEach((r: any) => { if (!r.id) r.id = nextId(); rows.push(r) })
        const last = list[list.length - 1] as any
        return { select(_c: string) { return { async single() { return { data: { id: last.id }, error: null } } } }, then(res: (v: { error: null }) => void) { res({ error: null }) } } as any
      },
      update(patch: any) { return { async eq(c: string, v: unknown) { rows.filter((r) => r[c] === v).forEach((r) => Object.assign(r, patch)); return { error: null } } } },
      delete() { return { async eq(c: string, v: unknown) { for (let i = rows.length - 1; i >= 0; i--) if (rows[i][c] === v) rows.splice(i, 1); return { error: null } } } }
    }
  }
  return { db: { from } as unknown as SupabaseLike, store }
}

// ----- stub rubric mirroring lib/rubric (3 capacity + 4 infra for this test) -----
const RUBRIC: RubricCtx = {
  capacity: [{ key: 'warmth', en: 'Warmth' }, { key: 'planning', en: 'Planning' }, { key: 'safety', en: 'Safety' }],
  infra: [{ key: 'water', en: 'Safe & clean water' }, { key: 'toilets', en: 'Toilets & sanitation' }, { key: 'space', en: 'Indoor space' }, { key: 'light', en: 'Lighting' }],
  meanLevel: (xs) => { const v = xs.filter((s): s is number => typeof s === 'number' && Number.isFinite(s)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null },
  levelToScore: (m) => Math.round(((m - 1) / 3) * 100),
  tierForScore: (s) => s >= 75 ? { label: 'Level 4 — Highest Intended Standard', pathway: 'Standard pathway' }
    : s >= 50 ? { label: 'Level 3 — Functional Standard', pathway: 'Operational recognition with improvement' }
      : { label: 'Level 2 — Entry-Level / Emerging Standard', pathway: 'Provisional recognition' }
}

let pass = 0, fail = 0
function ok(cond: boolean, msg: string) { if (cond) { pass++; console.log('  ✓ ' + msg) } else { fail++; console.log('  ✗ ' + msg) } }

const MEMBER_UUID = '11111111-1111-4111-8111-111111111111'
const assessmentItem = {
  clientId: 'asm-1', type: 'assessment' as const,
  payload: { clientId: 'asm-1', centreId: MEMBER_UUID, capacity: { warmth: 3, planning: 4, safety: 3 }, infra: { water: 2, toilets: 3, space: 4, light: 3 }, notes: 'Vizuri', gps: { lat: -6.8, lng: 39.27 }, photos: [] }
}

console.log('assessment sync (canonical scoring):')
const { db, store } = makeFakeDb()
const r1 = await processSyncBatch(db, { configVersion: '2026.06-baseline', items: [assessmentItem] }, '2026.06-baseline', RUBRIC)
ok(r1.results[0].status === 'accepted', 'assessment accepted')
ok(store.rubric_assessments.length === 1, 'one rubric_assessments row')
const a = store.rubric_assessments[0]
ok(a.member_id === MEMBER_UUID, 'links to member UUID')
ok(a.source === 'apk_synced', "source = 'apk_synced'")
ok(Math.abs(a.infra_result - 3) < 1e-9, 'infra mean = 3.0 (unrounded, like web)')
ok(a.infra_score === 67, 'infra_score = 67 (levelToScore)')
ok(a.infra_tier === 'Level 3 — Functional Standard', 'tier = canonical label (matches web form)')
ok(a.formalization_pathway === 'Operational recognition with improvement', 'formalization pathway stored')
ok(store.rubric_domain_scores.length === 7, 'all 7 domain rows (3 capacity + 4 infra)')
ok(store.rubric_domain_scores.some((d) => d.domain_label === 'Safe & clean water'), 'domain_label uses English name (like web), not the key')

console.log('\nidempotent retry:')
const r2 = await processSyncBatch(db, { items: [assessmentItem] }, null, RUBRIC)
ok(r2.results[0].status === 'accepted' && store.rubric_assessments.length === 1, 'retry accepted, no duplicate')

console.log('\nvalidation + registration:')
const bad = await processSyncBatch(db, { items: [{ clientId: 'x', type: 'assessment', payload: { centreId: 'c1', infra: {}, capacity: {} } }] }, null, RUBRIC)
ok(bad.results[0].status === 'rejected', 'non-UUID centreId rejected')
const reg = { clientId: 'reg-1', type: 'registration' as const, payload: { clientId: 'reg-1', centreName: 'Kituo Kipya', ownerName: 'Asha', phone: '0712000111', ward: 'Manzese', children: 12, consent: { publicListing: true } } }
const r3 = await processSyncBatch(db, { items: [reg] }, null, RUBRIC)
ok(r3.results[0].status === 'accepted' && store.members.length === 1, 'registration accepted, member created')
ok(store.app_users[0].member_id === store.members[0].id, 'app_user back-linked to member')
ok(store.members[0].membership_status === 'pending', 'new centre is pending')
const r4 = await processSyncBatch(db, { items: [reg] }, null, RUBRIC)
ok(r4.results[0].status === 'accepted' && store.members.length === 1, 'duplicate registration deduped')

console.log(`\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
