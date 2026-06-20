/**
 * Field-app sync core (framework-agnostic, DB-injected → unit-testable).
 *
 * Writes the UVIWATA Field App's offline queue into the platform's NATIVE rubric
 * storage (rubric_assessments + rubric_domain_scores from migration 0004) with no
 * lossy mapping. The platform computes the tier; the app only captures Level 1–4.
 *
 * `db` is anything with the subset of the supabase-js query builder used here, so
 * the real admin client works in production and a fake works in tests.
 */

const UVIWADA_DAR_ORG_ID = '00000000-0000-0000-0000-000000000011'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type Level = number
export type DomainMap = Record<string, Level>

export interface SyncItem {
  clientId: string
  type: 'assessment' | 'registration'
  payload: Record<string, unknown>
}
export interface SyncBatch {
  configVersion?: string | null
  items: SyncItem[]
}
export interface SyncResult {
  clientId: string
  status: 'accepted' | 'rejected'
  error?: string
  id?: string
}

// Minimal shape of the supabase query builder we rely on.
export interface SupabaseLike {
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: unknown): {
        maybeSingle(): Promise<{ data: unknown; error: unknown }>
        eq(col: string, val: unknown): { maybeSingle(): Promise<{ data: unknown; error: unknown }> }
      }
    }
    insert(rows: unknown): {
      select(cols: string): { single(): Promise<{ data: unknown; error: { message?: string } | null }> }
      error?: unknown
    } & Promise<{ error: { message?: string } | null }>
    update(patch: unknown): { eq(col: string, val: unknown): Promise<{ error: unknown }> }
    delete(): { eq(col: string, val: unknown): Promise<{ error: unknown }> }
  }
}

// ----------------------------------------------------------------- pure helpers
export function mean(map: DomainMap): number | null {
  const vals = Object.values(map || {}).map(Number).filter((n) => Number.isFinite(n))
  if (!vals.length) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100
}

// Platform computes the tier from the infrastructure mean (the app never does).
export function tierFromInfra(infraMean: number | null): string | null {
  if (infraMean == null) return null
  if (infraMean >= 3.5) return 'Level 4 — Highest standard'
  if (infraMean >= 2.5) return 'Level 3 — Functional'
  return 'Level 2 — Emerging'
}

export function score0to100(m: number | null): number | null {
  if (m == null) return null
  return Math.max(0, Math.min(100, Math.round(((m - 1) / 3) * 100)))
}

function domainRows(assessmentId: string, kind: 'capacity' | 'infra', map: DomainMap) {
  return Object.entries(map || {}).map(([key, level]) => ({
    assessment_id: assessmentId,
    kind,
    domain_key: key,
    domain_label: key, // payload carries keys only; label enriched server-side later
    level: Number.isFinite(Number(level)) ? Number(level) : null
  }))
}

function uuid(): string {
  return (globalThis.crypto as Crypto).randomUUID()
}

// ----------------------------------------------------------------- core
export async function processSyncBatch(
  db: SupabaseLike,
  batch: SyncBatch,
  configVersion: string | null
): Promise<{ configVersion: string | null; results: SyncResult[] }> {
  const results: SyncResult[] = []
  for (const item of batch.items || []) {
    try {
      if (item.type === 'assessment') results.push(await syncAssessment(db, item))
      else if (item.type === 'registration') results.push(await syncRegistration(db, item))
      else results.push({ clientId: item.clientId, status: 'rejected', error: 'unknown type' })
    } catch (err) {
      results.push({ clientId: item.clientId, status: 'rejected', error: String((err as Error)?.message || err) })
    }
  }
  return { configVersion, results }
}

async function syncAssessment(db: SupabaseLike, item: SyncItem): Promise<SyncResult> {
  const p = item.payload as {
    clientId?: string; centreId?: string; infra?: DomainMap; capacity?: DomainMap
    notes?: string; gps?: { lat?: number; lng?: number } | null
  }
  const submissionUuid = p.clientId || item.clientId
  const memberId = p.centreId || ''
  if (!UUID_RE.test(memberId)) {
    return { clientId: item.clientId, status: 'rejected', error: 'centreId is not a platform member UUID' }
  }

  const existing = await db.from('rubric_assessments').select('id').eq('submission_uuid', submissionUuid).maybeSingle()
  if (existing.data) return { clientId: item.clientId, status: 'accepted', id: (existing.data as { id: string }).id }

  const capacityMean = mean(p.capacity || {})
  const infraMean = mean(p.infra || {})

  const ins = await db.from('rubric_assessments').insert({
    member_id: memberId, submission_uuid: submissionUuid, assessment_type: 'field',
    assessed_on: new Date().toISOString().slice(0, 10),
    gps_lat: p.gps?.lat ?? null, gps_lng: p.gps?.lng ?? null,
    capacity_result: capacityMean, capacity_score: score0to100(capacityMean),
    infra_result: infraMean, infra_score: score0to100(infraMean),
    infra_tier: tierFromInfra(infraMean), assessor_comments: p.notes || null,
    source: 'apk_synced', raw: item.payload
  }).select('id').single()
  if (ins.error || !ins.data) throw new Error(ins.error?.message || 'assessment insert failed')
  const assessmentId = (ins.data as { id: string }).id

  const rows = [
    ...domainRows(assessmentId, 'capacity', p.capacity || {}),
    ...domainRows(assessmentId, 'infra', p.infra || {})
  ]
  if (rows.length) {
    const ds = await db.from('rubric_domain_scores').insert(rows)
    if (ds.error) throw new Error('domain scores failed: ' + ((ds.error as { message?: string }).message || ''))
  }
  return { clientId: item.clientId, status: 'accepted', id: assessmentId }
}

async function syncRegistration(db: SupabaseLike, item: SyncItem): Promise<SyncResult> {
  const p = item.payload as {
    centreName?: string; ownerName?: string; phone?: string; ward?: string
    children?: number; gps?: { lat?: number; lng?: number } | null
    consent?: { publicListing?: boolean }
  }
  if (!p.centreName || !p.phone) {
    return { clientId: item.clientId, status: 'rejected', error: 'centreName and phone are required' }
  }

  const dupe = await db.from('members').select('id').eq('centre_name', p.centreName).eq('phone', p.phone).maybeSingle()
  if (dupe.data) return { clientId: item.clientId, status: 'accepted', id: (dupe.data as { id: string }).id }

  const userId = uuid()
  const memberId = uuid()

  const u = await db.from('app_users').insert({
    id: userId, org_id: UVIWADA_DAR_ORG_ID, role: 'member',
    full_name: p.ownerName || 'Owner', phone: p.phone, member_id: null, ward: p.ward || null
  })
  if (u.error) throw new Error('app_user insert failed: ' + (u.error.message || ''))

  const m = await db.from('members').insert({
    id: memberId, org_id: UVIWADA_DAR_ORG_ID, centre_name: p.centreName, owner_user_id: userId,
    ward: p.ward || null, district: p.ward || null, lat: p.gps?.lat ?? null, lng: p.gps?.lng ?? null,
    phone: p.phone, children_count: p.children ?? 0, caregiver_count: 0, license_status: 'not_applied',
    membership_status: 'pending', consent_join: true, consent_public_listing: !!p.consent?.publicListing,
    consent_at: new Date().toISOString(), latest_quality: null
  })
  if (m.error) {
    await db.from('app_users').delete().eq('id', userId)
    throw new Error('member insert failed: ' + (m.error.message || ''))
  }
  await db.from('app_users').update({ member_id: memberId }).eq('id', userId)
  return { clientId: item.clientId, status: 'accepted', id: memberId }
}
