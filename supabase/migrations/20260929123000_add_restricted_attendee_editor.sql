-- Add a least-privilege portal account that can receive and edit only the
-- full_name and position of active, non-test attendees.
begin;

create table if not exists public.attendee_editor_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique
    check (char_length(username) between 3 and 80),
  created_at timestamptz not null default now()
);

alter table public.attendee_editor_users enable row level security;

revoke all on public.attendee_editor_users from public, anon, authenticated;
grant select on public.attendee_editor_users to authenticated;
grant select, insert, update, delete on public.attendee_editor_users to service_role;

create table if not exists public.attendee_directory_edit_audit (
  id bigint generated always as identity primary key,
  registration_id uuid not null,
  editor_user_id uuid not null,
  old_full_name text not null,
  new_full_name text not null,
  old_position text not null,
  new_position text not null,
  edited_at timestamptz not null default now()
);

alter table public.attendee_directory_edit_audit enable row level security;
revoke all on public.attendee_directory_edit_audit from public, anon, authenticated;
grant select on public.attendee_directory_edit_audit to service_role;

drop policy if exists "Attendee editors can view their membership"
  on public.attendee_editor_users;
create policy "Attendee editors can view their membership"
  on public.attendee_editor_users
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_ktaf_attendee_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.attendee_editor_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_ktaf_attendee_editor() from public;
grant execute on function public.is_ktaf_attendee_editor() to authenticated;

create or replace function public.get_ktaf_attendee_directory()
returns table (
  id uuid,
  full_name text,
  position text
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
  select r.id, r.full_name, r.position
  from public.registrations as r
  where r.registration_status = 'registered'
    and not r.is_test
  order by lower(r.full_name), r.id;
end;
$$;

revoke all on function public.get_ktaf_attendee_directory() from public;
grant execute on function public.get_ktaf_attendee_directory() to authenticated;

create or replace function public.update_ktaf_attendee_directory_entry(
  p_id uuid,
  p_full_name text,
  p_position text,
  p_expected_full_name text,
  p_expected_position text
)
returns table (
  id uuid,
  full_name text,
  position text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name text := regexp_replace(trim(coalesce(p_full_name, '')), '[[:space:]]+', ' ', 'g');
  clean_position text := regexp_replace(trim(coalesce(p_position, '')), '[[:space:]]+', ' ', 'g');
begin
  if not public.is_ktaf_attendee_editor() then
    raise exception using errcode = '42501', message = 'KTAF_ATTENDEE_EDITOR_REQUIRED';
  end if;
  if char_length(clean_name) not between 2 and 120 then
    raise exception using errcode = '22023', message = 'KTAF_INVALID_ATTENDEE_NAME';
  end if;
  if char_length(clean_position) not between 2 and 120 then
    raise exception using errcode = '22023', message = 'KTAF_INVALID_ATTENDEE_POSITION';
  end if;

  return query
  update public.registrations as r
  set full_name = clean_name,
      position = clean_position
  where r.id = p_id
    and r.full_name = p_expected_full_name
    and r.position = p_expected_position
    and r.registration_status = 'registered'
    and not r.is_test
  returning r.id, r.full_name, r.position;

  if not found then
    raise exception using errcode = 'P0002', message = 'KTAF_ATTENDEE_CHANGED';
  end if;

  insert into public.attendee_directory_edit_audit (
    registration_id,
    editor_user_id,
    old_full_name,
    new_full_name,
    old_position,
    new_position
  ) values (
    p_id,
    auth.uid(),
    p_expected_full_name,
    clean_name,
    p_expected_position,
    clean_position
  );
end;
$$;

revoke all on function public.update_ktaf_attendee_directory_entry(uuid, text, text, text, text) from public;
grant execute on function public.update_ktaf_attendee_directory_entry(uuid, text, text, text, text) to authenticated;

comment on table public.attendee_editor_users is
  'Approved username-based portal accounts limited to attendee name and position.';
comment on table public.attendee_directory_edit_audit is
  'Private server-side history of name and position changes made by restricted editors.';
comment on function public.get_ktaf_attendee_directory() is
  'Returns only id, full_name and position to approved restricted editors.';
comment on function public.update_ktaf_attendee_directory_entry(uuid, text, text, text, text) is
  'Allows approved restricted editors to update only full_name and position with conflict protection.';

commit;
