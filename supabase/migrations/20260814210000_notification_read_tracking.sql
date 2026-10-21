alter table public.notifications
  add column if not exists read_at timestamptz;

create policy "notifications: patient mark own read" on public.notifications
  for update using (
    exists (select 1 from public.appointments a where a.id = appointment_id and a.patient_id = auth.uid())
  )
  with check (
    exists (select 1 from public.appointments a where a.id = appointment_id and a.patient_id = auth.uid())
  );
