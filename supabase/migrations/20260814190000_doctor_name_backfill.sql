-- =========================================================
-- Backfill: new doctor accounts now get a "Dr." title applied
-- automatically at the app layer (see lib/format.ts formatDoctorName,
-- used at every point a doctor's full_name gets written). This is a
-- one-time fix for doctor profiles created before that existed —
-- doesn't touch names that already carry a "Dr"/"Dr." prefix.
-- =========================================================
update public.profiles
set full_name = 'Dr. ' || full_name
where role = 'doctor'
  and full_name is not null
  and full_name !~* '^dr\.?\s';
