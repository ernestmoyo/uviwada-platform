import Link from 'next/link'

import { LoginRoleSwitcher } from '@/components/LoginRoleSwitcher'
import { TopBar } from '@/components/TopBar'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'
import { listAllDemoMemberOptions } from '@/lib/demo-fallback'

interface MemberOption {
  id: string
  centre_name: string
  ward: string
  district: string
  org_id: string
}

// Centre owners can sign in to ANY centre regardless of which tenant the
// admin currently has selected via TenantSwitcher — owner identity belongs
// to the centre, not to whoever happens to be browsing the admin console.
async function fetchMemberOptions(): Promise<MemberOption[]> {
  if (!isSupabaseConfigured()) return listAllDemoMemberOptions()
  const supabase = getSupabaseAdmin()
  if (!supabase) return listAllDemoMemberOptions()
  const { data, error } = await supabase
    .from('members')
    .select('id, centre_name, ward, district, org_id')
    .order('ward', { ascending: true })
    .order('centre_name', { ascending: true })
  if (error || !data || data.length === 0) return listAllDemoMemberOptions()
  return (data as MemberOption[]).map((m) => ({
    id: m.id,
    centre_name: m.centre_name,
    ward: m.ward,
    district: m.district,
    org_id: m.org_id
  }))
}

export default async function LoginPage() {
  const memberOptions = await fetchMemberOptions()
  return (
    <>
      <TopBar />
      <NavBar />
      <main className="section">
        <div className="container" style={{ maxWidth: '720px' }}>
          <LoginRoleSwitcher memberOptions={memberOptions} />
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
