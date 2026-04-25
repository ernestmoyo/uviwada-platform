import Link from 'next/link'

import { LoginRoleSwitcher } from '@/components/LoginRoleSwitcher'
import { TopBar } from '@/components/TopBar'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { getSupabaseAdmin } from '@/lib/supabase/server'

interface MemberOption {
  id: string
  centre_name: string
  ward: string
}

async function fetchMemberOptions(): Promise<MemberOption[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  const { data } = await supabase
    .from('members')
    .select('id, centre_name, ward, owner_user_id')
    .not('owner_user_id', 'is', null)
    .limit(8)
  return ((data ?? []) as Array<{ id: string; centre_name: string; ward: string }>).map((m) => ({
    id: m.id,
    centre_name: m.centre_name,
    ward: m.ward
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
