'use client'

interface PrintButtonProps {
  label?: string
}

export function PrintButton({ label = 'Print PDF' }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      type="button"
      className="btn"
      style={{
        background: '#fff',
        color: 'var(--primary-dark)',
        border: '1px solid var(--border)',
        padding: '0.45rem 0.95rem',
        fontSize: '0.85rem'
      }}
    >
      {label}
    </button>
  )
}
