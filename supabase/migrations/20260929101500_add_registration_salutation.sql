-- Store organizer-approved salutations without changing submitted names or positions.
-- Null means the portal may show a position-based suggestion, or request team review.
begin;
alter table public.registrations
  add column if not exists salutation text
    check (salutation is null or salutation in ('Dr.', 'Ph.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.', 'Miss'));

-- The existing UPDATE policy limits writes to authenticated KTAF administrators.
grant update (salutation) on public.registrations to authenticated;
commit;
