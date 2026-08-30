alter table public.registrations
  add column if not exists phone_number text,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by uuid references auth.users(id) on delete set null,
  add column if not exists badge_printed_at timestamptz,
  add column if not exists badge_print_count integer not null default 0
    check (badge_print_count >= 0);

alter table public.registrations
  drop constraint if exists registrations_phone_number_length;
alter table public.registrations
  add constraint registrations_phone_number_length
  check (
    phone_number is null
    or char_length(phone_number) between 7 and 25
  );

create index if not exists registrations_checked_in_at_idx
  on public.registrations (checked_in_at desc)
  where checked_in_at is not null;

grant update (
  checked_in_at,
  checked_in_by,
  badge_printed_at,
  badge_print_count
) on public.registrations to authenticated;

comment on column public.registrations.phone_number is
  'Attendee phone number submitted with registration.';
comment on column public.registrations.checked_in_at is
  'First successful conference-desk check-in time.';
comment on column public.registrations.badge_print_count is
  'Number of badge print jobs started from the KTAF team portal.';
