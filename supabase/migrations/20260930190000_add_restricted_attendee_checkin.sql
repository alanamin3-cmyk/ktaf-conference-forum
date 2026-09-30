-- Extend the existing attendee-editor role with least-privilege attendance
-- visibility, read-only phone numbers, and one-at-a-time QR check-in. Email,
-- city and registration references are never returned to the restricted browser.
begin;

create or replace function public.get_ktaf_attendee_checkin_directory()
returns table (
  id uuid,
  full_name text,
  "position" text,
  phone_number text,
  checked_in_at timestamptz
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
  select r.id, r.full_name, r.position, r.phone_number, r.checked_in_at
  from public.registrations as r
  where r.registration_status = 'registered'
    and not r.is_test
  order by r.checked_in_at desc nulls last, lower(r.full_name), r.id;
end;
$$;

revoke all on function public.get_ktaf_attendee_checkin_directory() from public;
grant execute on function public.get_ktaf_attendee_checkin_directory() to authenticated;

create or replace function public.check_in_ktaf_attendee(p_registration_code text)
returns table (
  id uuid,
  full_name text,
  "position" text,
  phone_number text,
  checked_in_at timestamptz,
  already_checked_in boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_code text := upper(trim(coalesce(p_registration_code, '')));
  attendee_id uuid;
  attendee_name text;
  attendee_position text;
  attendee_phone_number text;
  attendee_checked_in_at timestamptz;
  was_already_checked_in boolean;
begin
  if not public.is_ktaf_attendee_editor() then
    raise exception using errcode = '42501', message = 'KTAF_ATTENDEE_EDITOR_REQUIRED';
  end if;

  if clean_code !~ '^KTAF-[0-9]{4}-[0-9]{6}$' then
    raise exception using errcode = '22023', message = 'KTAF_INVALID_REGISTRATION_CODE';
  end if;

  select r.id, r.full_name, r.position, r.phone_number, r.checked_in_at
  into attendee_id, attendee_name, attendee_position, attendee_phone_number, attendee_checked_in_at
  from public.registrations as r
  where upper(r.registration_code) = clean_code
    and r.registration_status = 'registered'
    and not r.is_test
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'KTAF_ATTENDEE_NOT_ACTIVE';
  end if;

  was_already_checked_in := attendee_checked_in_at is not null;

  if not was_already_checked_in then
    update public.registrations as r
    set checked_in_at = now(),
        checked_in_by = auth.uid()
    where r.id = attendee_id
    returning r.checked_in_at into attendee_checked_in_at;
  end if;

  return query
  select
    attendee_id,
    attendee_name,
    attendee_position,
    attendee_phone_number,
    attendee_checked_in_at,
    was_already_checked_in;
end;
$$;

revoke all on function public.check_in_ktaf_attendee(text) from public;
grant execute on function public.check_in_ktaf_attendee(text) to authenticated;

comment on function public.get_ktaf_attendee_checkin_directory() is
  'Returns only attendee id, name, position, phone number and check-in time to approved restricted editors.';
comment on function public.check_in_ktaf_attendee(text) is
  'Checks in one active attendee by QR reference without exposing the reference, email or city.';

commit;
