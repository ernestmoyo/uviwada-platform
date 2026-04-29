'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { useI18n } from '@/lib/i18n'
import type { DemoRole } from '@/lib/auth-presets'
import { DemoModeBanner } from './DemoModeBanner'
import { TenantSwitcher } from './TenantSwitcher'

interface AdminNavProps {
  fullName: string
  role: DemoRole
  currentTenantId: string
  demoMode?: boolean
}

interface NavLink {
  href: string
  sw: string
  en: string
}

const ALL_LINKS = {
  overview: { href: '/admin', sw: 'Dashibodi', en: 'Overview' },
  members: { href: '/admin/members', sw: 'Wanachama', en: 'Members' },
  trainings: { href: '/admin/trainings', sw: 'Mafunzo', en: 'Trainings' },
  assessments: { href: '/admin/assessments', sw: 'Tathmini', en: 'Assessments' },
  announcements: { href: '/admin/announcements', sw: 'Matangazo', en: 'Announcements' },
  me: { href: '/dashboard', sw: 'M&E', en: 'M&E Dashboard' }
} as const

function linksForRole(role: DemoRole): NavLink[] {
  switch (role) {
    case 'admin':
      return [
        ALL_LINKS.overview,
        ALL_LINKS.members,
        ALL_LINKS.trainings,
        ALL_LINKS.assessments,
        ALL_LINKS.announcements,
        ALL_LINKS.me
      ]
    case 'secretariat':
      return [
        ALL_LINKS.overview,
        ALL_LINKS.members,
        ALL_LINKS.trainings,
        ALL_LINKS.assessments,
        ALL_LINKS.announcements
      ]
    case 'cic_staff':
      return [ALL_LINKS.me, ALL_LINKS.members]
    case 'assessor':
      return [ALL_LINKS.assessments, ALL_LINKS.members]
    case 'member':
      return []
  }
}

export function AdminNav({ fullName, role, currentTenantId, demoMode = false }: AdminNavProps) {
  const { lang, toggle } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const links = linksForRole(role)
  const showTenantSwitcher = role === 'admin'

  async function logout() {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }

  return (
    <header
      style={{
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      <DemoModeBanner active={demoMode} />
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 1.25rem',
          gap: '1rem'
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Image src="/logo.svg" alt="UVIWADA" width={120} height={36} style={{ height: 32, width: 'auto' }} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {showTenantSwitcher && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TenantSwitcher currentTenantId={currentTenantId} />
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
                title={
                  lang === 'sw'
                    ? 'Onyesho la upanuzi: UVIWATA na matawi ya kikanda (Awamu ya 2)'
                    : 'Scalability preview: UVIWATA + regional branches (Phase 2)'
                }
              >
                {lang === 'sw' ? 'Awamu 2' : 'Phase 2'}
              </span>
            </div>
          )}
          <button
            onClick={toggle}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '0.3rem 0.7rem',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            {lang.toUpperCase()}
          </button>
          <div style={{ textAlign: 'right', fontSize: '0.78rem' }}>
            <strong>{fullName}</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{role}</div>
          </div>
          <button
            onClick={logout}
            className="btn"
            style={{ background: 'var(--accent)', color: '#fff', padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
          >
            {lang === 'sw' ? 'Toka' : 'Log out'}
          </button>
        </div>
      </div>
      <nav
        style={{
          background: 'var(--bg-alt)',
          borderTop: '1px solid var(--border)'
        }}
      >
        <div className="container" style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', padding: '0 1.25rem' }}>
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href))
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: '0.7rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: active ? 'var(--primary)' : 'var(--muted)',
                  borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                {lang === 'sw' ? l.sw : l.en}
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
