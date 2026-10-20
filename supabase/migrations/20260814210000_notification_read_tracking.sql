-- =========================================================
-- There was no way to tell a patient "you have unread reminders" at
-- all -- the bell icon had no badge because the data model had no
-- concept of read/unread. Adds read_at (null = unread) and a policy
-- letting a patient mark their own notifications read (the app only
-- ever writes read_at through this path, same pattern as the doctor
-- self-update policy added earlier -- RLS is row-level, not
-- column-level, so this is enforced by what the app actually sends).
-- =========================================================
alter table public.notifications
  add column if not exists read_at timestamptz;

create policy "notifications: patient mark own read" on public.notifications
  for update using (
    exists (select 1 from public.appointments a where a.id = appointment_id and a.patient_id = auth.uid())
  )
  with check (
    exists (select 1 from public.appointments a where a.id = appointment_id and a.patient_id = auth.uid())
  );
