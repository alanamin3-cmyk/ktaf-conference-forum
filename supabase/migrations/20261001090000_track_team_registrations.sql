-- Record the authenticated staff member who creates a manual registration.
-- Creation still runs through the authenticated Edge Function and capacity trigger.
alter table public.registrations
  add column if not exists created_by uuid references auth.users(id) on delete set null;

comment on column public.registrations.created_by is
  'Authenticated KTAF staff member who manually created this registration.';
