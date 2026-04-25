'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { useI18n } from '@/lib/i18n'
import { TenantSwitcher } from './TenantSwitcher'

interface AdminNavProps {
  fullName: string
  role: string
  currentTenantId: string
}

export function AdminNav({ fullName, role, currentTenantId }: AdminNavProps) {
  const { lang, toggle } = useI18n()
  const pathname = usePathname()
  const router = useRouter()

  const links = [
    { href: '/admin', sw: 'Dashibodi', en: 'Overview' },
    { href: '/admin/members', sw: 'Wanachama', en: 'Members' },
    { href: '/admin/trainings', sw: 'Mafunzo', en: 'Trainings' },
    { href: '/admin/assessments', sw: 'Tathmini', en: 'Assessments' },
    { href: '/admin/announcements', sw: 'Matangazo', en: 'Announcements' },
    { href: '/dashboard', sw: 'M&E', en: 'M&E Dashboard' }
  ]

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
          <TenantSwitcher currentTenantId={currentTenantId} />
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
