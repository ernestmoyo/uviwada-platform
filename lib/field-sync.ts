/**
 * Field-app sync core (framework-agnostic, dependency-injected → unit-testable).
 *
 * Writes the UVIWATA Field App's offline queue into the platform's NATIVE rubric
 * storage (rubric_assessments + rubric_domain_scores from migration 0004) with no
 * lossy mapping. Scoring is delegated to a `RubricCtx` (the canonical lib/rubric in
 * production), so an app-synced assessment is scored/labelled IDENTICALLY to one
 * entered through the web form (/api/rubric-assessments).
 *
 * `db` is anything with the subset of the supabase-js query builder used here, so
 * the real admin client works in production and a fake works in tests.
 */

const UVIWADA_DAR_ORG_ID = '00000000-0000-0000-0000-000000000011'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type DomainMap = Record<string, number>

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

// The canonical rubric, injected so production uses lib/rubric and tests can stub.
export interface RubricCtx {
  capacity: ReadonlyArray<{ key: string; en: string }>
  infra: ReadonlyArray<{ key: string; en: string }>
  meanLevel(scores: Array<number | null | undefined>): number | null
  levelToScore(mean1to4: number): number
  tierForScore(score0to100: number): { label: string; pathway: string }
}

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
    } & Promise<{ error: { message?: string } | null }>
    update(patch: unknown): { eq(col: string, val: unknown): Promise<{ error: unknown }> }
    delete(): { eq(col: string, val: unknown): Promise<{ error: unknown }> }
  }
}

function uuid(): string {
  return (globalThis.crypto as Crypto).randomUUID()
}

// ----------------------------------------------------------------- core
export async function processSyncBatch(
  db: SupabaseLike,
  batch: SyncBatch,
  configVersion: string | null,
  rubric: RubricCtx
): Promise<{ configVersion: string | null; results: SyncResult[] }> {
  const results: SyncResult[] = []
  for (const item of batch.items || []) {
    try {
      if (item.type === 'assessment') results.push(await syncAssessment(db, item, rubric))
      else if (item.type === 'registration') results.push(await syncRegistration(db, item))
      else results.push({ clientId: item.clientId, status: 'rejected', error: 'unknown type' })
    } catch (err) {
      results.push({ clientId: item.clientId, status: 'rejected', error: String((err as Error)?.message || err) })
    }
  }
  return { configVersion, results }
}

async function syncAssessment(db: SupabaseLike, item: SyncItem, rubric: RubricCtx): Promise<SyncResult> {
  const p = item.payload as {
    clientId?: string; centreId?: string; infra?: DomainMap; capacity?: DomainMap
    notes?: string; gps?: { lat?: number; lng?: number } | null; photos?: string[]
  }
  const submissionUuid = p.clientId || item.clientId
  const memberId = p.centreId || ''
  if (!UUID_RE.test(memberId)) {
    return { clientId: item.clientId, status: 'rejected', error: 'centreId is not a platform member UUID' }
  }

  const existing = await db.from('rubric_assessments').select('id').eq('submission_uuid', submissionUuid).maybeSingle()
  if (existing.data) return { clientId: item.clientId, status: 'accepted', id: (existing.data as { id: string }).id }

  const capMap = p.capacity || {}
  const infraMap = p.infra || {}
  // Score with the SAME canonical rubric the web form uses (server-authoritative).
  const capMean = rubric.meanLevel(rubric.capacity.map((c) => capMap[c.key] ?? null))
  const infraMean = rubric.meanLevel(rubric.infra.map((c) => infraMap[c.key] ?? null))
  const capScore = capMean == null ? null : rubric.levelToScore(capMean)
  const infraScore = infraMean == null ? null : rubric.levelToScore(infraMean)
  const tierDef = infraScore == null ? null : rubric.tierForScore(infraScore)

  const ins = await db.from('rubric_assessments').insert({
    member_id: memberId, submission_uuid: submissionUuid, assessment_type: 'field',
    assessed_on: new Date().toISOString().slice(0, 10),
    gps_lat: p.gps?.lat ?? null, gps_lng: p.gps?.lng ?? null,
    capacity_result: capMean, capacity_score: capScore,
    infra_result: infraMean, infra_score: infraScore,
    infra_tier: tierDef?.label ?? null, formalization_pathway: tierDef?.pathway ?? null,
    assessor_comments: p.notes || null, source: 'apk_synced',
    raw: { capacity: capMap, infra: infraMap, photo_urls: p.photos ?? [], via: 'apk_synced', client_id: submissionUuid }
  }).select('id').single()
  if (ins.error || !ins.data) throw new Error(ins.error?.message || 'assessment insert failed')
  const assessmentId = (ins.data as { id: string }).id

  // One row per domain (all 27, even unrated → null), labelled like the web form.
  const rows = [
    ...rubric.capacity.map((c) => ({ assessment_id: assessmentId, kind: 'capacity', domain_key: c.key, domain_label: c.en, level: capMap[c.key] ?? null })),
    ...rubric.infra.map((c) => ({ assessment_id: assessmentId, kind: 'infra', domain_key: c.key, domain_label: c.en, level: infraMap[c.key] ?? null }))
  ]
  const ds = await db.from('rubric_domain_scores').insert(rows)
  if (ds.error) throw new Error('domain scores failed: ' + ((ds.error as { message?: string }).message || ''))

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
