-- Pre-approved roster of hospital workers (doctors, front-desk, admin).
-- Self-service staff signup checks this table instead of an email domain
-- (the hospital has no institutional domain — staff use personal email
-- addresses). An admin maintains this list; self-signup only succeeds for
-- an email that already appears here, and the OTP flow then proves the
-- signer-upper actually controls that exact inbox.
create table public.staff_roster (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('doctor', 'front-desk', 'admin')),
  specialty text,
  claimed boolean not null default false,
  claimed_at timestamptz,
  added_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index staff_roster_email_idx on public.staff_roster (email);

alter table public.staff_roster enable row level security;

-- Admins manage the roster through their own authenticated session.
-- Anonymous signup lookups go through the service-role admin client
-- (same pattern as staff_signup_requests), bypassing RLS entirely.
create policy "staff_roster: admin manage" on public.staff_roster
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');
