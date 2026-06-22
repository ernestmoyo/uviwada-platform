// Client-safe constants. Anything that touches next/headers, cookies, or the
// Supabase admin client lives in lib/auth.ts (server only).

export type DemoRole = 'member' | 'secretariat' | 'assessor' | 'cic_staff' | 'admin'

export const SEED_USER_PRESETS = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    role: 'secretariat' as const,
    label_sw: 'Sekretarieti UVIWATA',
    label_en: 'UVIWATA Secretariat'
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    role: 'assessor' as const,
    label_sw: 'Mtathmini wa Ubora',
    label_en: 'Quality Assessor'
  },
  {
    id: '00000000-0000-0000-0000-000000000103',
    role: 'cic_staff' as const,
    label_sw: 'Afisa wa Programu',
    label_en: 'Programme Officer'
  },
  {
    id: '00000000-0000-0000-0000-000000000104',
    role: 'admin' as const,
    label_sw: 'Msimamizi wa Mfumo',
    label_en: 'Platform Admin'
  }
] as const

export function landingRouteForRole(role: DemoRole): string {
  switch (role) {
    case 'member':
      return '/portal'
    case 'secretariat':
    case 'admin':
      return '/admin'
    case 'assessor':
      return '/assess'
    case 'cic_staff':
      return '/dashboard'
  }
}
