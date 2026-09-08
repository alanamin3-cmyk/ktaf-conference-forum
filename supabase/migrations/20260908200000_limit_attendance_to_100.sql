begin;

-- Keep test records without allowing them to consume real attendee seats.
-- Only trusted backend/database operators can change this flag.
alter table public.registrations
  add column if not exists is_test boolean not null default false;

create table public.registration_capacity (
  id boolean primary key default true check (id),
  seat_limit integer not null default 100 check (seat_limit = 100),
  occupied integer not null check (occupied between 0 and seat_limit)
);

alter table public.registration_capacity enable row level security;
revoke all on public.registration_capacity from public, anon, authenticated, service_role;

-- The ALTER TABLE lock above also prevents writes during initialization.
insert into public.registration_capacity (id, occupied)
select true, count(*)::integer
from public.registrations
where registration_status = 'registered' and not is_test;

create function public.enforce_registration_capacity()
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
    -- One atomic, row-locking UPDATE serializes concurrent seat requests.
    -- AFTER triggers count only rows actually written, including upserts.
    update public.registration_capacity
    set occupied = occupied + seat_change
    where id = true
      and occupied + seat_change between 0 and seat_limit;

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

revoke all on function public.enforce_registration_capacity() from public, anon, authenticated, service_role;

create trigger registrations_enforce_capacity
after insert or delete or update of registration_status, is_test
on public.registrations
for each row execute function public.enforce_registration_capacity();

-- Public visitors get availability only, never attendee details.
create function public.get_registration_capacity()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'limit', seat_limit,
    'registered', occupied,
    'remaining', seat_limit - occupied
  )
  from public.registration_capacity where id = true;
$$;

revoke all on function public.get_registration_capacity() from public;
grant execute on function public.get_registration_capacity() to anon, authenticated, service_role;

commit;
