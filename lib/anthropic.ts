import 'server-only'

import Anthropic from '@anthropic-ai/sdk'

// Server-only Claude client. Mirrors lib/supabase/server.ts: read the key from
// the environment, return null when unset so callers can 503 cleanly. The key
// lives ONLY on the server (demo/.env.local locally, Vercel env in prod) — it is
// never shipped to the browser or the mobile app, which call our API routes.

// Default to Opus 4.8 (most capable). Override with ANTHROPIC_MODEL to trade
// cost/latency (e.g. claude-sonnet-4-6, claude-haiku-4-5).
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8'

export function getAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  return new Anthropic({ apiKey })
}

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}
