-- User-approved increase; preserve attendee records, test exclusions and counters.
begin;
alter table public.registration_capacity
  drop constraint registration_capacity_seat_limit_check;
alter table public.registration_capacity
  alter column seat_limit set default 220;
update public.registration_capacity set seat_limit = 220 where id = true;
alter table public.registration_capacity
  add constraint registration_capacity_seat_limit_check check (seat_limit = 220);
commit;
