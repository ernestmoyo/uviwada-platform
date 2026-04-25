import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'UVIWADA Practical Pitch · 7Square Group',
  description: 'Practical pitch and demonstration deck — 30 April 2026, UVIWADA Office, Magomeni Mapipa.'
}

export default function PitchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
