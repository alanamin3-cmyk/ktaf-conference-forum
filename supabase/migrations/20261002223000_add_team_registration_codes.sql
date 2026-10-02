-- Additive endpoint keeps older open portal tabs working. Codes are read-only;
-- emails, cities and direct table access remain restricted.
begin;
create or replace function public.get_ktaf_attendee_checkin_directory_v2()
returns table (
  id uuid,
  full_name text,
  "position" text,
  phone_number text,
  checked_in_at timestamptz,
  registration_code text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_ktaf_attendee_editor() then
    raise exception using errcode = '42501', message = 'KTAF_ATTENDEE_EDITOR_REQUIRED';
  end if;
  return query
  select r.id, r.full_name, r.position, r.phone_number, r.checked_in_at, r.registration_code
  from public.registrations as r
  where r.registration_status = 'registered' and not r.is_test
  order by r.checked_in_at desc nulls last, lower(r.full_name), r.id;
end;
$$;
revoke all on function public.get_ktaf_attendee_checkin_directory_v2() from public, anon;
grant execute on function public.get_ktaf_attendee_checkin_directory_v2() to authenticated;
comment on function public.get_ktaf_attendee_checkin_directory_v2() is
  'Approved team editors can see active attendee names, positions, phones, check-in times and read-only registration codes; no emails or cities.';
commit;
