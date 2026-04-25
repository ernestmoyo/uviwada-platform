import 'server-only'
import { cookies } from 'next/headers'

import { getSupabaseAdmin } from './supabase/server'
import { DEFAULT_TENANT_ID, TENANT_COOKIE, TENANT_PRESETS } from './tenant-presets'

export { TENANT_COOKIE, TENANT_PRESETS } from './tenant-presets'

export function getCurrentTenantId(): string {
  const cookieStore = cookies()
  return cookieStore.get(TENANT_COOKIE)?.value ?? DEFAULT_TENANT_ID
}

export function getCurrentTenant() {
  const id = getCurrentTenantId()
  return TENANT_PRESETS.find((t) => t.id === id) ?? TENANT_PRESETS[0]
}

export interface OrgRow {
  id: string
  name: string
  scope: string
  parent_org_id: string | null
}

export async function fetchOrgs(): Promise<OrgRow[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return TENANT_PRESETS.map((t) => ({ id: t.id, name: t.name, scope: t.scope, parent_org_id: null }))
  try {
    const { data } = await supabase
      .from('organisations')
      .select('id, name, scope, parent_org_id')
      .order('name')
    return (data ?? []) as OrgRow[]
  } catch {
    return TENANT_PRESETS.map((t) => ({ id: t.id, name: t.name, scope: t.scope, parent_org_id: null }))
  }
}
