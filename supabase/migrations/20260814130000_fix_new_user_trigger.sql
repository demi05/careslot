-- =========================================================
-- Fix: backfill any auth.users rows missing a matching profiles row,
-- and re-install the trigger that creates one on future signups.
-- Safe to run even if everything already worked correctly.
-- =========================================================

-- Re-create the trigger function (idempotent — same body as before).
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
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop and re-create the trigger so we know for certain it exists.
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create a profiles row for any existing auth user who is
-- missing one (covers accounts created before this trigger existed).
insert into public.profiles (id, full_name, phone, role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  u.raw_user_meta_data ->> 'phone',
  coalesce(u.raw_user_meta_data ->> 'role', 'patient')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
