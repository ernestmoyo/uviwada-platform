'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (typeof console !== 'undefined') {
      console.error('UVIWADA render error', error)
    }
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: '4rem 1.5rem',
          maxWidth: 640,
          margin: '0 auto',
          color: '#1f2937'
        }}
      >
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          The UVIWADA platform hit an unexpected error rendering this page. Try again, or visit the{' '}
          <Link href="/legacy" style={{ color: '#1A5FAA' }}>
            static fallback site
          </Link>{' '}
          while we investigate.
        </p>
        {error.digest && (
          <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
            Reference: <code>{error.digest}</code>
          </p>
        )}
        <button
          onClick={reset}
          style={{
            background: '#1A5FAA',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.6rem 1.1rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
