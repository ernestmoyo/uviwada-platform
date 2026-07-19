// One-off: apply the additive training-cluster schema to the linked Supabase
// project via the Management API (the same endpoint the dashboard SQL editor
// uses). Idempotent — safe to re-run. Reads SUPABASE_ACCESS_TOKEN from
// .env.local; no secret is passed on the command line.
import { readFileSync } from 'node:fs'

function envValue(name) {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && m[1] === name) return m[2].replace(/^['"]|['"]$/g, '').trim()
  }
  return null
}

const token = envValue('SUPABASE_ACCESS_TOKEN')
const ref = readFileSync(new URL('../supabase/.temp/project-ref', import.meta.url), 'utf8').trim()
if (!token) throw new Error('SUPABASE_ACCESS_TOKEN not found in .env.local')

const SQL = `
alter table trainings add column if not exists min_participants int not null default 0;
alter table trainings add column if not exists status text not null default 'published';

create table if not exists training_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  member_id uuid references members(id),
  category text,
  topic text,
  note text,
  status text default 'open',
  created_at timestamptz default now()
);

alter table members add column if not exists portal_last_seen_at timestamptz;
`.trim()

async function runQuery(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, body: text }
}

// 1) sanity read
const ping = await runQuery('select current_database() as db;')
console.log('ping:', ping.status, ping.body.slice(0, 200))
if (!ping.ok) process.exit(1)

// 2) apply migration
const applied = await runQuery(SQL)
console.log('migrate:', applied.status, applied.body.slice(0, 400))
if (!applied.ok) process.exit(1)

// 3) verify new columns/table
const verify = await runQuery(`
select
  (select count(*) from information_schema.columns where table_name='trainings' and column_name in ('min_participants','status')) as trainings_cols,
  (select count(*) from information_schema.tables where table_name='training_requests') as training_requests_table,
  (select count(*) from information_schema.columns where table_name='members' and column_name='portal_last_seen_at') as members_col;
`)
console.log('verify:', verify.status, verify.body.slice(0, 300))
