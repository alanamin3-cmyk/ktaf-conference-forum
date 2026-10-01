-- Production rehearsal: synthetic attendees, no email, all changes rolled back.
begin;
do $$
declare
  before_count integer;
  first_id uuid := gen_random_uuid();
  second_id uuid := gen_random_uuid();
begin
  select occupied into before_count from public.registration_capacity where id = true for update;
  if not (public.get_registration_capacity()->>'unlimited')::boolean then
    raise exception 'Registration is not unlimited';
  end if;
  insert into public.registrations(id, full_name, position, city, phone_number, email, registration_code)
  values
    (first_id, 'Capacity verification', 'Test', 'Test', '0000000000', first_id::text || '@example.invalid', first_id::text),
    (second_id, 'Capacity verification', 'Test', 'Test', '0000000000', second_id::text || '@example.invalid', second_id::text);
  if (select occupied from public.registration_capacity) <> before_count + 2 then
    raise exception 'New registrations were not counted';
  end if;
  update public.registrations set registration_status = 'cancelled' where id = first_id;
  update public.registrations set is_test = true where id = second_id;
  if (select occupied from public.registration_capacity) <> before_count then
    raise exception 'Cancellation or test exclusion changed';
  end if;
  update public.registrations set registration_status = 'registered' where id = first_id;
  if (select occupied from public.registration_capacity) <> before_count + 1 then
    raise exception 'Restoration was not counted';
  end if;
  if has_table_privilege('anon', 'public.registration_capacity', 'UPDATE') then
    raise exception 'Anonymous visitors can edit capacity';
  end if;
end;
$$;
select 'PASS: additional attendees accepted; cancellation, restoration and test exclusions preserved; all rehearsal records rolled back' as result;
rollback;
