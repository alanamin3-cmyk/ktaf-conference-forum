begin;

-- Preserve occupied seats, test exclusions and the atomic capacity trigger.
alter table public.registration_capacity
  drop constraint registration_capacity_seat_limit_check;
alter table public.registration_capacity
  alter column seat_limit set default 200;
update public.registration_capacity set seat_limit = 200 where id = true;
alter table public.registration_capacity
  add constraint registration_capacity_seat_limit_check check (seat_limit = 200);

commit;
