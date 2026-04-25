'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useI18n } from '@/lib/i18n'
import { TENANT_PRESETS } from '@/lib/tenant-presets'

interface TenantSwitcherProps {
  currentTenantId: string
}

export function TenantSwitcher({ currentTenantId }: TenantSwitcherProps) {
  const { lang } = useI18n()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function switchTo(tenantId: string) {
    if (tenantId === currentTenantId || busy) return
    setBusy(true)
    try {
      await fetch('/api/tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId })
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <select
      value={currentTenantId}
      onChange={(e) => switchTo(e.target.value)}
      disabled={busy}
      style={{
        padding: '0.4rem 0.7rem',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: '#fff',
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: busy ? 'wait' : 'pointer',
        color: 'var(--primary-dark)'
      }}
      aria-label={lang === 'sw' ? 'Chama' : 'Tenant'}
    >
      {TENANT_PRESETS.map((t) => (
        <option key={t.id} value={t.id}>
          {lang === 'sw' ? t.label_sw : t.label_en}
          {t.scope === 'national' ? ' 🇹🇿' : ''}
        </option>
      ))}
    </select>
  )
}
