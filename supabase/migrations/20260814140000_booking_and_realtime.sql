-- =========================================================
-- Adds what the booking, appointments, and profile screens need:
--   - reminder-channel preferences on profiles
--   - a get_available_slots() function (doctor_schedules minus
--     already-booked appointments, for a given doctor + date)
--   - Realtime enabled on appointments / notifications / medications
-- =========================================================

-- ---------------------------------------------------------
-- reminder preferences
-- ---------------------------------------------------------
alter table public.profiles
  add column if not exists sms_reminders boolean not null default true,
  add column if not exists email_reminders boolean not null default true;

-- ---------------------------------------------------------
-- available appointment slots for a doctor on a given date
-- (doctor_schedules windows, minus times already booked)
-- ---------------------------------------------------------
create or replace function public.get_available_slots(p_doctor_id uuid, p_date date)
returns table (slot_time time)
language sql
stable
as $$
  with schedule as (
    select start_time, end_time, slot_duration_minutes
    from public.doctor_schedules
    where doctor_id = p_doctor_id
      and day_of_week = extract(dow from p_date)::smallint
      and is_active
  ),
  generated as (
    select (start_time + (n * schedule.slot_duration_minutes) * interval '1 minute')::time as slot_time
    from schedule,
    lateral generate_series(
      0,
      greatest(
        0,
        floor(extract(epoch from (schedule.end_time - schedule.start_time)) / (schedule.slot_duration_minutes * 60))::int - 1
      )
    ) as n
  ),
  booked as (
    select appointment_time
    from public.appointments
    where doctor_id = p_doctor_id
      and appointment_date = p_date
      and status <> 'cancelled'
  )
  select g.slot_time
  from generated g
  where g.slot_time not in (select appointment_time from booked)
  order by g.slot_time;
$$;

grant execute on function public.get_available_slots(uuid, date) to authenticated;

-- ---------------------------------------------------------
-- Realtime: let patients see live status/delivery updates without
-- a page refresh (e.g. staff confirms an appointment, a reminder is
-- sent, or a medication is marked collected while they're on the page)
-- ---------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'medications'
  ) then
    alter publication supabase_realtime add table public.medications;
  end if;
end $$;
