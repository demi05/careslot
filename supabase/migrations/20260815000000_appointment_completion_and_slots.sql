-- =========================================================
-- Fixes two related gaps in the booking/attendance flow:
--
--   1. There was no way to record that a confirmed appointment
--      actually happened. "confirmed" meant both "booked, in the
--      future" and "patient was seen" with nothing to tell them
--      apart, so a doctor's history looked identical to their
--      upcoming list. Adds a "completed" status, staff set when the
--      patient is checked in/seen. Anything still "confirmed" after
--      its date has fully passed without being completed is swept
--      to "no-show" automatically (see api/cron/auto-no-show).
--
--   2. The slot uniqueness constraint applied to cancelled rows too,
--      so a cancelled appointment permanently blocked anyone from
--      ever booking that doctor/date/time again. Replaced with a
--      partial unique index that ignores cancelled rows.
--
--   get_available_slots() now returns every generated slot for the
--   day with an is_available flag (false once booked, or once its
--   time has passed for today), instead of silently omitting
--   unavailable ones -- the booking UI needs to show and disable
--   them, not just hide them.
-- =========================================================

alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments
  add constraint appointments_status_check
  check (status in ('pending', 'confirmed', 'cancelled', 'no-show', 'completed'));

-- Drop whatever the original unqualified "unique (doctor_id, appointment_date,
-- appointment_time)" constraint ended up named, by signature rather than a
-- guessed name, then replace it with a partial index that ignores cancelled
-- rows so a cancelled slot can be rebooked.
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class t on t.oid = con.conrelid
    where t.relname = 'appointments'
      and con.contype = 'u'
      and (select array_agg(x order by x) from unnest(con.conkey) x) = (
        select array_agg(a.attnum order by a.attnum)
        from pg_attribute a
        where a.attrelid = t.oid
          and a.attname in ('doctor_id', 'appointment_date', 'appointment_time')
      )
  loop
    execute format('alter table public.appointments drop constraint %I', c.conname);
  end loop;
end $$;

create unique index if not exists appointments_doctor_slot_unique
  on public.appointments (doctor_id, appointment_date, appointment_time)
  where status <> 'cancelled';

drop function if exists public.get_available_slots(uuid, date);

create or replace function public.get_available_slots(p_doctor_id uuid, p_date date)
returns table (slot_time time, is_available boolean)
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
  select
    g.slot_time,
    (
      g.slot_time not in (select appointment_time from booked)
      and (
        p_date > (now() at time zone 'Africa/Lagos')::date
        or (
          p_date = (now() at time zone 'Africa/Lagos')::date
          and g.slot_time > (now() at time zone 'Africa/Lagos')::time
        )
      )
    ) as is_available
  from generated g
  order by g.slot_time;
$$;

grant execute on function public.get_available_slots(uuid, date) to authenticated;
