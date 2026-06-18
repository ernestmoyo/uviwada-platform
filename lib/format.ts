// Deterministic formatters — identical output on the server (UTC) and in the
// browser, so they never cause React hydration mismatches. Always pass an
// explicit locale and the Tanzania timezone (EAT, UTC+3); the environment
// default must never leak in.
const TZ = 'Africa/Nairobi' // East Africa Time (UTC+3) — same as Dar es Salaam

/** Group a number with thousands separators (e.g. 1,234). */
export function fmtNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return n.toLocaleString('en-US')
}

/** Date only, e.g. "18 Jun 2026". */
export function fmtDate(value: string | number | Date | null | undefined): string {
  if (value == null) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' })
}

/** Date + time, e.g. "18 Jun 2026, 19:30". */
export function fmtDateTime(value: string | number | Date | null | undefined): string {
  if (value == null) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
