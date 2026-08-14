-- =========================================================
-- CareSlot database schema
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query)
-- or via `supabase db push` if you're using the Supabase CLI.
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- profiles: one row per auth user (patient, doctor, front-desk, admin)
-- ---------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'patient' check (role in ('patient', 'doctor', 'front-desk', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- doctors: doctor-specific profile info, 1:1 with profiles
-- ---------------------------------------------------------
create table public.doctors (
  id uuid primary key references public.profiles (id) on delete cascade,
  specialty text not null,
  bio text,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- doctor_schedules: recurring weekly availability windows.
-- Bookable slots are derived from these at query time, rather than
-- pre-generating a row per slot.
-- ---------------------------------------------------------
create table public.doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  slot_duration_minutes integer not null default 30 check (slot_duration_minutes > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint doctor_schedules_valid_range check (end_time > start_time)
);

create index doctor_schedules_doctor_id_idx on public.doctor_schedules (doctor_id);

-- ---------------------------------------------------------
-- appointments
-- ---------------------------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'no-show')),
  reason text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, appointment_date, appointment_time)
);

create index appointments_patient_id_idx on public.appointments (patient_id);
create index appointments_doctor_id_idx on public.appointments (doctor_id);
create index appointments_date_idx on public.appointments (appointment_date);

-- ---------------------------------------------------------
-- notifications: SMS / email delivery log per appointment
-- ---------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  channel text not null check (channel in ('sms', 'email')),
  recipient text not null,
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_appointment_id_idx on public.notifications (appointment_id);

-- ---------------------------------------------------------
-- medications: flagged for patient pickup
-- ---------------------------------------------------------
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  medication_name text not null,
  dosage text,
  status text not null default 'pending' check (status in ('pending', 'collected')),
  logged_by uuid not null references public.profiles (id),
  logged_at timestamptz not null default now(),
  collected_at timestamptz
);

create index medications_patient_id_idx on public.medications (patient_id);

-- ---------------------------------------------------------
-- keep updated_at fresh
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- auto-create a profile row whenever someone signs up
-- (covers email/password signUp, and Google sign-in via signInWithIdToken)
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'role', 'patient')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------
-- role helper used inside RLS policies (security definer avoids
-- recursive RLS checks when a policy needs to read someone's role)
-- ---------------------------------------------------------
create or replace function public.current_role()
returns text
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.doctor_schedules enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;
alter table public.medications enable row level security;

-- profiles: everyone can read their own row; doctors/front-desk/admin can
-- read everyone's (they need patient and colleague names to operate the
-- app). Only the owner or an admin can update a row.
create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles: staff read all" on public.profiles
  for select using (public.current_role() in ('doctor', 'front-desk', 'admin'));

create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid());

create policy "profiles: admin update all" on public.profiles
  for update using (public.current_role() = 'admin');

-- doctors: any signed-in user can browse doctors (needed to book);
-- only front-desk/admin manage doctor profiles.
create policy "doctors: read all (authenticated)" on public.doctors
  for select using (auth.role() = 'authenticated');

create policy "doctors: staff manage" on public.doctors
  for all using (public.current_role() in ('front-desk', 'admin'))
  with check (public.current_role() in ('front-desk', 'admin'));

-- doctor_schedules: any signed-in user can read availability;
-- only front-desk/admin manage schedules.
create policy "doctor_schedules: read all (authenticated)" on public.doctor_schedules
  for select using (auth.role() = 'authenticated');

create policy "doctor_schedules: staff manage" on public.doctor_schedules
  for all using (public.current_role() in ('front-desk', 'admin'))
  with check (public.current_role() in ('front-desk', 'admin'));

-- appointments: patients see/manage their own; doctors see their own;
-- front-desk/admin see and manage everyone's.
create policy "appointments: patient read own" on public.appointments
  for select using (patient_id = auth.uid());

create policy "appointments: doctor read own" on public.appointments
  for select using (doctor_id = auth.uid());

create policy "appointments: staff read all" on public.appointments
  for select using (public.current_role() in ('front-desk', 'admin'));

create policy "appointments: patient book own" on public.appointments
  for insert with check (patient_id = auth.uid());

create policy "appointments: staff book any" on public.appointments
  for insert with check (public.current_role() in ('front-desk', 'admin'));

create policy "appointments: patient update own" on public.appointments
  for update using (patient_id = auth.uid());

create policy "appointments: staff update any" on public.appointments
  for update using (public.current_role() in ('front-desk', 'admin'));

-- notifications: patients can read the log for their own appointments;
-- only front-desk/admin manage the delivery log (sending itself happens
-- server-side with the service role key, which bypasses RLS entirely).
create policy "notifications: patient read own" on public.notifications
  for select using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id and a.patient_id = auth.uid()
    )
  );

create policy "notifications: staff manage" on public.notifications
  for all using (public.current_role() in ('front-desk', 'admin'))
  with check (public.current_role() in ('front-desk', 'admin'));

-- medications: patients read their own pickups; doctors/front-desk/admin
-- log and manage pickup status.
create policy "medications: patient read own" on public.medications
  for select using (patient_id = auth.uid());

create policy "medications: staff manage" on public.medications
  for all using (public.current_role() in ('doctor', 'front-desk', 'admin'))
  with check (public.current_role() in ('doctor', 'front-desk', 'admin'));
