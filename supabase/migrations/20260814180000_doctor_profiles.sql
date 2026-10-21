-- =========================================================
-- Two gaps found during staff-portal testing:
--
-- 1. Patients couldn't see doctor names anywhere (booking wizard,
--    appointment cards, confirmations) — "profiles: read own" only lets
--    a user read their own row, and "profiles: staff read all" only
--    covers doctor/front-desk/admin viewers, so a patient joining
--    doctors -> profiles(full_name) always got null back from RLS, not
--    missing data. Doctor bios/specialties were already public via the
--    separate "doctors" table; profiles.full_name just wasn't.
--
-- 2. Doctors had no way to edit their own profile (name/phone already
--    worked via the existing "profiles: update own" policy, which every
--    staff role already has — but their own "doctors" row, which holds
--    bio/photo_url, had no self-update policy at all: only
--    "doctors: staff manage" (front-desk/admin) could touch it).
-- =========================================================

create policy "profiles: authenticated read doctor profiles" on public.profiles
  for select using (auth.role() = 'authenticated' and role = 'doctor');

-- Doctors can update their own doctors row (bio/photo_url via the new
-- staff profile page). Specialty stays admin-controlled in practice —
-- the self-edit form never sends it — this policy just doesn't forbid
-- it at the database level, matching how profile self-edit already
-- works elsewhere in this project (RLS is row-level, not column-level;
-- the app layer controls which fields a given form actually writes).
create policy "doctors: self update" on public.doctors
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------
-- Storage: a public bucket for doctor profile photos. Public read (so
-- the photo renders in the patient-facing booking flow without an
-- authenticated fetch), but a doctor may only write to a path prefixed
-- with their own user id, so one doctor can't overwrite another's photo.
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('doctor-photos', 'doctor-photos', true)
on conflict (id) do nothing;

create policy "doctor-photos: public read" on storage.objects
  for select using (bucket_id = 'doctor-photos');

create policy "doctor-photos: owner write" on storage.objects
  for insert with check (bucket_id = 'doctor-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "doctor-photos: owner update" on storage.objects
  for update using (bucket_id = 'doctor-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "doctor-photos: owner delete" on storage.objects
  for delete using (bucket_id = 'doctor-photos' and (storage.foldername(name))[1] = auth.uid()::text);
