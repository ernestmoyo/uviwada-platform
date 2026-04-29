'use client'

import { useEffect, useState } from 'react'

import type { DemoRole } from './auth-presets'

export interface SessionInfo {
  signedIn: boolean
  role: DemoRole | null
}

const INITIAL: SessionInfo = { signedIn: false, role: null }

// Tiny client-side hook for components that need to know the current role
// without forcing the page itself dynamic. Used to gate UI like the
// assessor-only Field App section on the public homepage.
export function useSession(): SessionInfo {
  const [session, setSession] = useState<SessionInfo>(INITIAL)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { signedIn?: boolean; role?: DemoRole } | null) => {
        if (cancelled) return
        if (json?.signedIn && json.role) {
          setSession({ signedIn: true, role: json.role })
        } else {
          setSession(INITIAL)
        }
      })
      .catch(() => {
        if (!cancelled) setSession(INITIAL)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return session
}

export function canSeeFieldApp(role: DemoRole | null): boolean {
  return role === 'admin' || role === 'assessor'
}
