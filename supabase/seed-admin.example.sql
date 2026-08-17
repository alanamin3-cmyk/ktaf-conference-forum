-- First create the team member in Supabase:
-- Authentication > Users > Add user
-- Then replace the email below and run this statement in the SQL Editor.

insert into public.admin_users (user_id, email)
select id, lower(email)
from auth.users
where lower(email) = lower('team.member@example.com')
on conflict (user_id) do update set email = excluded.email;
