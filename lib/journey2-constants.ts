// Shared Journey-02 constants + types. NO 'server-only' here so client
// components (badges, moderation UI) can import the labels/types safely.
// The server-only transition logic lives in membership-service.ts.

export type MembershipStatus = 'pending' | 'approved' | 'rejected'
export type ProfilePublicStatus = 'draft' | 'published' | 'hidden' | 'pending_update'
export type SectionStatus = 'published' | 'hidden'

export const SECTION_KEYS = ['contact', 'location', 'capacity', 'licensing'] as const
export type SectionKey = (typeof SECTION_KEYS)[number]

export const SECTION_LABELS: Record<SectionKey, { en: string; sw: string }> = {
  contact: { en: 'Contact details', sw: 'Mawasiliano' },
  location: { en: 'Location', sw: 'Mahali' },
  capacity: { en: 'Capacity & children', sw: 'Uwezo na watoto' },
  licensing: { en: 'Licensing', sw: 'Leseni' }
}
