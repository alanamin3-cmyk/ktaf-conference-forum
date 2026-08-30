alter table public.registrations
  add column if not exists registration_status text not null default 'registered'
    check (registration_status in ('registered', 'cancelled')),
  add column if not exists status_updated_at timestamptz not null default now(),
  add column if not exists cancellation_note text
    check (cancellation_note is null or char_length(cancellation_note) <= 500);

drop policy if exists "KTAF admins can update registration status"
  on public.registrations;
create policy "KTAF admins can update registration status"
  on public.registrations
  for update
  to authenticated
  using (public.is_ktaf_admin())
  with check (public.is_ktaf_admin());

drop policy if exists "KTAF admins can delete registrations"
  on public.registrations;
create policy "KTAF admins can delete registrations"
  on public.registrations
  for delete
  to authenticated
  using (public.is_ktaf_admin());

grant update (registration_status, status_updated_at, cancellation_note)
  on public.registrations to authenticated;
grant delete on public.registrations to authenticated;
