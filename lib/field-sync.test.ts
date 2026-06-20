/* Safe, DB-free integration test for the field-sync core.
   Run: node --experimental-strip-types lib/field-sync.test.ts
   Uses an in-memory fake Supabase — no database, never touches production. */

import { processSyncBatch, mean, tierFromInfra, type SupabaseLike } from './field-sync.ts'

// ----- in-memory fake supabase (only the chains field-sync uses) -----
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
          async maybeSingle() {
            const hit = rows.find((r) => filters.every(([c, v]) => r[c] === v))
            return { data: hit ? { id: hit.id } : null, error: null }
          }
        }
        return api
      },
      insert(payload: unknown) {
        const list = Array.isArray(payload) ? payload : [payload]
        list.forEach((r: any) => { if (!r.id) r.id = nextId(); rows.push(r) })
        const last = list[list.length - 1] as any
        const thenable: any = {
          select(_c: string) { return { async single() { return { data: { id: last.id }, error: null } } } },
          then(resolve: (v: { error: null }) => void) { resolve({ error: null }) }
        }
        return thenable
      },
      update(patch: any) {
        return { async eq(col: string, val: unknown) { rows.filter((r) => r[col] === val).forEach((r) => Object.assign(r, patch)); return { error: null } } }
      },
      delete() {
        return { async eq(col: string, val: unknown) { for (let i = rows.length - 1; i >= 0; i--) if (rows[i][col] === val) rows.splice(i, 1); return { error: null } } }
      }
    }
  }
  return { db: { from } as unknown as SupabaseLike, store }
}

// ----- tiny assert -----
let pass = 0, fail = 0
function ok(cond: boolean, msg: string) { if (cond) { pass++; console.log('  ✓ ' + msg) } else { fail++; console.log('  ✗ ' + msg) } }

// ----- helper unit checks -----
console.log('helpers:')
ok(mean({ a: 2, b: 4 }) === 3, 'mean averages levels')
ok(mean({}) === null, 'mean of empty is null')
ok(tierFromInfra(3.6) === 'Level 4 — Highest standard', 'tier 4 at >=3.5')
ok(tierFromInfra(3.0) === 'Level 3 — Functional', 'tier 3 at >=2.5')
ok(tierFromInfra(2.0) === 'Level 2 — Emerging', 'tier 2 below 2.5')

const MEMBER_UUID = '11111111-1111-4111-8111-111111111111'

const assessmentItem = {
  clientId: 'asm-1', type: 'assessment' as const,
  payload: {
    clientId: 'asm-1', centreId: MEMBER_UUID, rubricVersion: '2026.06-baseline',
    capacity: { warmth: 3, planning: 4, safety: 3 },
    infra: { water: 2, toilets: 3, space: 4, light: 3 },
    notes: 'Vizuri', gps: { lat: -6.8, lng: 39.27 }, photos: []
  }
}

console.log('\nassessment sync:')
const { db, store } = makeFakeDb()
const r1 = await processSyncBatch(db, { configVersion: '2026.06-baseline', items: [assessmentItem] }, '2026.06-baseline')
ok(r1.results[0].status === 'accepted', 'assessment accepted')
ok(store.rubric_assessments.length === 1, 'one rubric_assessments row written')
const a = store.rubric_assessments[0]
ok(a.member_id === MEMBER_UUID, 'links to member UUID')
ok(a.source === 'apk_synced', 'source = apk_synced')
ok(a.submission_uuid === 'asm-1', 'submission_uuid = clientId (idempotency key)')
ok(a.capacity_result === 3.33, 'capacity mean computed (3.33)')
ok(a.infra_result === 3, 'infra mean computed (3)')
ok(a.infra_tier === 'Level 3 — Functional', 'tier computed by platform')
ok(store.rubric_domain_scores.length === 7, 'all 7 domain rows written (3 capacity + 4 infra)')

console.log('\nidempotent retry:')
const r2 = await processSyncBatch(db, { items: [assessmentItem] }, null)
ok(r2.results[0].status === 'accepted', 'retry accepted')
ok(store.rubric_assessments.length === 1, 'no duplicate assessment on retry')

console.log('\nvalidation:')
const bad = await processSyncBatch(db, { items: [{ clientId: 'asm-x', type: 'assessment', payload: { centreId: 'c1', infra: {}, capacity: {} } }] }, null)
ok(bad.results[0].status === 'rejected', 'non-UUID centreId rejected')
ok(/UUID/.test(bad.results[0].error || ''), 'rejection explains why')

console.log('\nregistration sync:')
const reg = { clientId: 'reg-1', type: 'registration' as const, payload: { clientId: 'reg-1', centreName: 'Kituo Kipya', ownerName: 'Asha', phone: '0712000111', ward: 'Manzese', children: 12, consent: { publicListing: true } } }
const r3 = await processSyncBatch(db, { items: [reg] }, null)
ok(r3.results[0].status === 'accepted', 'registration accepted')
ok(store.members.length === 1, 'member row created')
ok(store.app_users.length === 1, 'app_user row created')
ok(store.app_users[0].member_id === store.members[0].id, 'app_user back-linked to member')
ok(store.members[0].membership_status === 'pending', 'new centre is pending approval')
const r4 = await processSyncBatch(db, { items: [reg] }, null)
ok(r4.results[0].status === 'accepted' && store.members.length === 1, 'duplicate registration deduped')

console.log(`\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
