import { NextResponse } from 'next/server'

import { fetchMembersForOrg, membersToCsv } from '@/lib/admin-data'
import { getCurrentUser } from '@/lib/auth'
import { getCurrentTenantId } from '@/lib/tenant'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['secretariat', 'admin', 'cic_staff'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.toLowerCase()
  const region = url.searchParams.get('region')
  const ward = url.searchParams.get('ward')
  const district = url.searchParams.get('district')
  const quality = url.searchParams.get('quality')
  const license = url.searchParams.get('license')

  const tenantId = getCurrentTenantId()
  let members = await fetchMembersForOrg(tenantId)
  if (q) members = members.filter((m) => m.centre_name.toLowerCase().includes(q))
  if (region) members = members.filter((m) => m.region === region)
  if (ward) members = members.filter((m) => m.ward === ward)
  if (district) members = members.filter((m) => m.district === district)
  if (quality) members = members.filter((m) => (m.latest_quality ?? '') === quality)
  if (license) members = members.filter((m) => m.license_status === license)

  const csv = membersToCsv(members)
  const filename = `uviwada-members-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
