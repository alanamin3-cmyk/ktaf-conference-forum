-- Run after the capacity migration. No email is sent; ALL fixture changes roll back.
begin;
do $$
declare
  used integer;
  blocked boolean;
begin
  select occupied into used from public.registration_capacity where id = true for update;
  if used >= 199 then
    raise exception 'Capacity rehearsal requires at least two free seats';
  end if;
  insert into public.registrations(full_name, position, city, email, registration_code)
  select 'Capacity rehearsal', 'Test', 'Test', 'capacity-rehearsal-' || n || '@example.invalid', 'CAPACITY-REHEARSAL-' || n
  from generate_series(1, 200 - used) n;
  if (select occupied from public.registration_capacity) <> 200 then
    raise exception 'Expected the 200th attendee to succeed';
  end if;

  blocked := false;
  begin
    insert into public.registrations(full_name, position, city, email, registration_code)
    values('Capacity rehearsal', 'Test', 'Test', 'capacity-overflow@example.invalid', 'CAPACITY-OVERFLOW');
  exception when sqlstate 'P0001' then
    if SQLERRM <> 'KTAF_CAPACITY_FULL' then raise; end if;
    blocked := true;
  end;
  if not blocked then raise exception 'The 201st attendee was not blocked'; end if;

  -- A duplicate INSERT that writes nothing must not consume another seat.
  insert into public.registrations(full_name, position, city, email, registration_code)
  values('Capacity rehearsal', 'Test', 'Test', 'capacity-rehearsal-1@example.invalid', 'CAPACITY-REHEARSAL-1')
  on conflict do nothing;

  insert into public.registrations(full_name, position, city, email, registration_code, is_test)
  values('Excluded test', 'Test', 'Test', 'capacity-excluded@example.invalid', 'CAPACITY-EXCLUDED', true);
  if (select occupied from public.registration_capacity) <> 200 then
    raise exception 'Test or duplicate changed the seat count';
  end if;

  update public.registrations set registration_status = 'cancelled' where registration_code = 'CAPACITY-REHEARSAL-1';
  if (select occupied from public.registration_capacity) <> 199 then
    raise exception 'Cancellation did not release a seat';
  end if;
  update public.registrations set is_test = false where registration_code = 'CAPACITY-EXCLUDED';

  blocked := false;
  begin
    update public.registrations set registration_status = 'registered' where registration_code = 'CAPACITY-REHEARSAL-1';
  exception when sqlstate 'P0001' then
    if SQLERRM <> 'KTAF_CAPACITY_FULL' then raise; end if;
    blocked := true;
  end;
  if not blocked then raise exception 'Restoration exceeded capacity'; end if;

  delete from public.registrations where registration_code = 'CAPACITY-EXCLUDED';
  update public.registrations set registration_status = 'registered' where registration_code = 'CAPACITY-REHEARSAL-1';
  update public.registrations set full_name = 'Renamed rehearsal' where registration_code = 'CAPACITY-REHEARSAL-1';
  if (select occupied from public.registration_capacity) <> 200 then
    raise exception 'Delete, restore or ordinary update corrupted capacity';
  end if;
  if has_column_privilege('authenticated', 'public.registrations', 'is_test', 'UPDATE') then
    raise exception 'Frontend users can bypass capacity by marking tests';
  end if;
  if has_table_privilege('anon', 'public.registration_capacity', 'UPDATE') then
    raise exception 'Visitors can edit capacity';
  end if;
end;
$$;
select 'PASS: 200 accepted; 201 blocked; tests excluded; duplicate, cancellation, restoration, deletion and permissions verified' as result;
rollback;
