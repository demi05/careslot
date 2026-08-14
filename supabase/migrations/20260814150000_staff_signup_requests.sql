-- =========================================================
-- Self-service staff signup: a patient-facing signup page can't just
-- let someone tick "I'm staff" and get in — this table holds pending
-- requests until they're verified by a one-time code emailed to their
-- hospital address (see app/(patient)/register/actions.ts).
--
-- No RLS policies are defined on purpose: this table is only ever
-- touched by Server Actions using the service-role admin client, so
-- the default (RLS enabled, zero policies = deny-all) keeps it
-- completely unreachable from the browser, including by signed-in
-- patients trying to read or forge a code.
-- =========================================================
create table public.staff_signup_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  requested_role text not null check (requested_role in ('doctor', 'front-desk')),
  specialty text,
  code text not null,
  expires_at timestamptz not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index staff_signup_requests_email_idx on public.staff_signup_requests (email);

alter table public.staff_signup_requests enable row level security;
