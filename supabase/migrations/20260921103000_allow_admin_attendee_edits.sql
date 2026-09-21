-- Enable the five submitted profile fields for existing approved portal admins.
-- The existing UPDATE RLS policy still requires public.is_ktaf_admin().
-- This does not grant anonymous access, add admins, or change any registration.
begin;
grant update (full_name, position, city, phone_number, email)
  on public.registrations to authenticated;
commit;
