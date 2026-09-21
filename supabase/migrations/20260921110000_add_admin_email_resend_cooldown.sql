begin;
-- Written only by the authenticated admin email service, never the browser.
alter table public.registrations
  add column if not exists email_resend_requested_at timestamptz;
comment on column public.registrations.email_resend_requested_at is
  'Last admin resend claim; prevents concurrent sends and enforces a two-minute cooldown.';
commit;
