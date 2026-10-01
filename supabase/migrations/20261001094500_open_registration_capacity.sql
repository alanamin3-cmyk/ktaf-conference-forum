-- NULL means registration is open without a numeric cap. Keep the existing
-- atomic attendee counter, test exclusions, RLS and account permissions.
begin;
alter table public.registration_capacity
  drop constraint if exists registration_capacity_seat_limit_check,
  drop constraint if exists registration_capacity_check,
  drop constraint if exists registration_capacity_occupied_check,
  alter column seat_limit drop not null,
  alter column seat_limit drop default;

alter table public.registration_capacity
  add constraint registration_capacity_seat_limit_check check (seat_limit is null or seat_limit > 0),
  add constraint registration_capacity_occupied_check check (occupied >= 0 and (seat_limit is null or occupied <= seat_limit));

update public.registration_capacity set seat_limit = null where id = true;

create or replace function public.enforce_registration_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_seats integer := 0;
  new_seats integer := 0;
  seat_change integer;
begin
  if TG_OP <> 'INSERT' then
    old_seats := case when OLD.registration_status = 'registered' and not OLD.is_test then 1 else 0 end;
  end if;
  if TG_OP <> 'DELETE' then
    new_seats := case when NEW.registration_status = 'registered' and not NEW.is_test then 1 else 0 end;
  end if;
  seat_change := new_seats - old_seats;
  if seat_change <> 0 then
    update public.registration_capacity
    set occupied = occupied + seat_change
    where id = true
      and occupied + seat_change >= 0
      and (seat_limit is null or occupied + seat_change <= seat_limit);
    if not found then
      if seat_change > 0 then
        raise exception using errcode = 'P0001', message = 'KTAF_CAPACITY_FULL';
      else
        raise exception 'KTAF_CAPACITY_UNAVAILABLE';
      end if;
    end if;
  end if;
  return null;
end;
$$;

create or replace function public.get_registration_capacity()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'limit', seat_limit,
    'registered', occupied,
    'remaining', seat_limit - occupied,
    'unlimited', seat_limit is null
  ) from public.registration_capacity where id = true;
$$;
commit;
