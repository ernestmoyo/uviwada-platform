-- Issue 12 — payment → certificate journey (server-side).
-- Apply in the Supabase SQL editor BEFORE deploying the Issue-12 code.
-- Additive and idempotent; safe to run more than once.

-- 1) Certificate records (one membership certificate per member per paid period).
create table if not exists certificates (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references members(id) on delete cascade,
  status       text not null default 'requested' check (status in ('requested', 'issued', 'revoked')),
  cert_ref     text unique,
  period_label text,
  period_start date,
  period_end   date,
  requested_at timestamptz not null default now(),
  approved_by  uuid,
  approved_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists certificates_member_idx on certificates (member_id);
create index if not exists certificates_status_idx on certificates (status);

-- 2) Payment verification (the secretariat physically verifies, then it counts).
--    Existing rows were recorded by the secretariat, so default them to 'verified'.
alter table member_payments add column if not exists status      text not null default 'verified'
  check (status in ('pending', 'verified', 'rejected'));
alter table member_payments add column if not exists verified_at timestamptz;
alter table member_payments add column if not exists verified_by uuid;
