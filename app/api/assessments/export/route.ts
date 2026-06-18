import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { fetchRubricSnapshot } from '@/lib/rubric-data'
import { CAPACITY_COMPETENCIES, INFRA_SUBDOMAINS } from '@/lib/rubric'

// CSV export of quality assessments for the Secretariat (and admin / CiC) to
// analyse in Excel or any third-party tool. CSV opens natively in Excel,
// Google Sheets, R, Python, etc. — no proprietary format needed.
export async function GET() {
  const user = await getCurrentUser()
  if (!user || !['secretariat', 'admin', 'cic_staff'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const snapshot = await fetchRubricSnapshot()

  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const header = [
    'Centre',
    'Council',
    'Ward',
    'Ownership',
    'Tier',
    'Capacity score',
    'Infrastructure score',
    'Children',
    'Latitude',
    'Longitude',
    ...CAPACITY_COMPETENCIES.map((d) => `Cap: ${d.en}`),
    ...INFRA_SUBDOMAINS.map((d) => `Infra: ${d.en}`)
  ]

  const rows = snapshot.centres.map((c) =>
    [
      c.name,
      c.council,
      c.ward,
      c.ownership,
      c.tier,
      c.capacity_score,
      c.infra_score,
      c.children_total,
      c.lat,
      c.lng,
      ...CAPACITY_COMPETENCIES.map((d) => c.capacity[d.key] ?? ''),
      ...INFRA_SUBDOMAINS.map((d) => c.infra[d.key] ?? '')
    ]
      .map(esc)
      .join(',')
  )

  const csv = [header.map(esc).join(','), ...rows].join('\n')
  const filename = `uviwata-assessments-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
