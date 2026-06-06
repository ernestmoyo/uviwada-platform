import { redirect } from 'next/navigation'

import { Certificate } from '@/components/membership/Certificate'
import { getCurrentUser } from '@/lib/auth'
import { fetchPortalSnapshot } from '@/lib/portal-data'

export const dynamic = 'force-dynamic'

export default async function CertificatePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'member') redirect('/admin')
  if (!user.member_id) redirect('/portal/register')

  const snapshot = await fetchPortalSnapshot(user.member_id)
  const c = snapshot.centre

  return (
    <Certificate
      memberId={user.member_id}
      centreName={c?.centre_name ?? user.full_name}
      ownerName={user.full_name}
      ward={c?.ward ?? user.ward ?? ''}
      district={c?.district ?? ''}
    />
  )
}
