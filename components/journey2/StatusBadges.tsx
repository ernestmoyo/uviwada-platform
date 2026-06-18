import type { MembershipStatus, ProfilePublicStatus, SectionStatus } from '@/lib/journey2-constants'

function badge(label: string, colour: string) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.18rem 0.6rem',
        borderRadius: 999,
        fontSize: '0.74rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        background: `${colour}1a`,
        color: colour,
        border: `1px solid ${colour}55`
      }}
    >
      {label}
    </span>
  )
}

const MEMBERSHIP_COLOURS: Record<MembershipStatus, string> = {
  pending: '#f59e0b',
  approved: '#16a34a',
  rejected: '#dc2626'
}

const PROFILE_COLOURS: Record<ProfilePublicStatus, string> = {
  draft: '#64748b',
  published: '#16a34a',
  hidden: '#94a3b8',
  pending_update: '#f59e0b'
}

export function MembershipBadge({ status }: { status: MembershipStatus }) {
  return badge(status, MEMBERSHIP_COLOURS[status] ?? '#64748b')
}

export function ProfileBadge({ status }: { status: ProfilePublicStatus }) {
  return badge(status.replace('_', ' '), PROFILE_COLOURS[status] ?? '#64748b')
}

export function SectionBadge({ status }: { status: SectionStatus }) {
  return badge(status, status === 'published' ? '#16a34a' : '#94a3b8')
}
