-- =========================================================
-- Table 3.1 in the project document grants doctors "Manage own
-- availability" and "View own schedule" — the code only let
-- front-desk/admin touch doctor_schedules at all. Lets a doctor manage
-- their own availability windows directly (front-desk/admin keep full
-- access too, e.g. to cover a doctor who's out sick).
-- =========================================================
create policy "doctor_schedules: doctor manage own" on public.doctor_schedules
  for all using (doctor_id = auth.uid())
  with check (doctor_id = auth.uid());
