// Client-safe tenant constants. Server-only helpers (cookies + DB) live in
// lib/tenant.ts.

export const TENANT_COOKIE = 'uviwada_tenant'

export const TENANT_PRESETS = [
  {
    id: '00000000-0000-0000-0000-000000000011',
    name: 'UVIWADA-DAR',
    label_sw: 'UVIWADA — Dar es Salaam',
    label_en: 'UVIWADA — Dar es Salaam',
    scope: 'regional' as const
  },
  {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'UVIWATA-NATIONAL',
    label_sw: 'UVIWATA — Kitaifa',
    label_en: 'UVIWATA — National',
    scope: 'national' as const
  },
  {
    id: '00000000-0000-0000-0000-000000000012',
    name: 'UVIWAKI-KILIMANJARO',
    label_sw: 'UVIWAKI — Kilimanjaro',
    label_en: 'UVIWAKI — Kilimanjaro',
    scope: 'regional' as const
  }
] as const

export const DEFAULT_TENANT_ID = TENANT_PRESETS[0].id

export const NATIONAL_TENANT_ID = '00000000-0000-0000-0000-000000000010'

// The national/federation tenant aggregates every region's data, so admin
// queries for it must NOT filter by a single org_id — they span all orgs.
export function isNationalTenant(orgId: string): boolean {
  return TENANT_PRESETS.some((t) => t.id === orgId && t.scope === 'national')
}
