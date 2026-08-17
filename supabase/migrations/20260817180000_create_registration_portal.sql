create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  position text not null check (char_length(position) between 2 and 120),
  city text not null check (char_length(city) between 2 and 100),
  email text not null unique check (char_length(email) between 5 and 254),
  registration_code text not null unique,
  consent_at timestamptz not null default now(),
  email_status text not null default 'pending'
    check (email_status in ('pending', 'sent', 'failed')),
  email_sent_at timestamptz,
  email_provider_id text,
  email_error text
);

create index if not exists registrations_created_at_idx
  on public.registrations (created_at desc);

create index if not exists registrations_city_idx
  on public.registrations (city);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.registrations enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_ktaf_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_ktaf_admin() from public;
grant execute on function public.is_ktaf_admin() to authenticated;

drop policy if exists "Admins can view their membership" on public.admin_users;
create policy "Admins can view their membership"
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "KTAF admins can view registrations" on public.registrations;
create policy "KTAF admins can view registrations"
  on public.registrations
  for select
  to authenticated
  using (public.is_ktaf_admin());

revoke all on public.registrations from anon;
revoke all on public.admin_users from anon;
revoke insert, update, delete on public.registrations from authenticated;
revoke insert, update, delete on public.admin_users from authenticated;
grant select on public.registrations to authenticated;
grant select on public.admin_users to authenticated;

-- Edge Functions use the service role to create registrations and update
-- confirmation-email delivery details. These grants are explicit because the
-- tables are created by a dashboard migration rather than the service role.
grant select, insert, update on public.registrations to service_role;
grant select on public.admin_users to service_role;
