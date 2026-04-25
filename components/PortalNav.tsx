'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { useI18n } from '@/lib/i18n'

interface PortalNavProps {
  fullName: string
  ward?: string | null
  role: string
}

export function PortalNav({ fullName, ward, role }: PortalNavProps) {
  const { lang, toggle } = useI18n()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }

  return (
    <nav
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
          padding: '0.75rem 1.25rem'
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Image src="/logo.svg" alt="UVIWADA" width={120} height={36} style={{ height: 36, width: 'auto' }} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
            <strong>{fullName}</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
              {role}
              {ward ? ` · ${ward}` : ''}
            </div>
          </div>
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
          <button
            onClick={logout}
            className="btn"
            style={{ background: 'var(--accent)', color: '#fff', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
          >
            {lang === 'sw' ? 'Toka' : 'Log out'}
          </button>
        </div>
      </div>
    </nav>
  )
}
