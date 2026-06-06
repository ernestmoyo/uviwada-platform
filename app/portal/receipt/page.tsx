import { redirect } from 'next/navigation'

import { Receipt } from '@/components/membership/Receipt'
import { getCurrentUser } from '@/lib/auth'
import { fetchPortalSnapshot } from '@/lib/portal-data'

export const dynamic = 'force-dynamic'

export default async function ReceiptPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'member') redirect('/admin')
  if (!user.member_id) redirect('/portal/register')

  const snapshot = await fetchPortalSnapshot(user.member_id)
  const c = snapshot.centre

  return (
    <Receipt
      memberId={user.member_id}
      centreName={c?.centre_name ?? user.full_name}
      ownerName={user.full_name}
      ward={c?.ward ?? user.ward ?? ''}
      district={c?.district ?? ''}
    />
  )
}
