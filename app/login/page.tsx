import Link from 'next/link'

import { LoginRoleSwitcher } from '@/components/LoginRoleSwitcher'
import { TopBar } from '@/components/TopBar'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import { listDemoMemberOptions } from '@/lib/demo-fallback'

interface MemberOption {
  id: string
  centre_name: string
  ward: string
  district: string
}

async function fetchMemberOptions(orgId: string): Promise<MemberOption[]> {
  if (!isSupabaseConfigured()) return listDemoMemberOptions(orgId)
  const supabase = getSupabaseAdmin()
  if (!supabase) return listDemoMemberOptions(orgId)
  const { data, error } = await supabase
    .from('members')
    .select('id, centre_name, ward, district')
    .eq('org_id', orgId)
    .order('ward', { ascending: true })
    .order('centre_name', { ascending: true })
  if (error || !data || data.length === 0) return listDemoMemberOptions(orgId)
  return (data as MemberOption[]).map((m) => ({
    id: m.id,
    centre_name: m.centre_name,
    ward: m.ward,
    district: m.district
  }))
}

export default async function LoginPage() {
  const tenant = getCurrentTenant()
  const memberOptions = await fetchMemberOptions(tenant.id)
  return (
    <>
      <TopBar />
      <NavBar />
      <main className="section">
        <div className="container" style={{ maxWidth: '720px' }}>
          <LoginRoleSwitcher memberOptions={memberOptions} tenantLabel={tenant.label_en} />
          <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
            <strong>Production note:</strong> the live platform will use phone-OTP / SSO. This demo skips auth so the
            panel can switch roles instantly during the pitch. RLS policies still enforce per-role row visibility.{' '}
            <Link href="/" style={{ color: 'var(--primary)' }}>
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
