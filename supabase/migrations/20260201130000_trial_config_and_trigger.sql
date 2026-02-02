-- Trial config (single row)
create table if not exists public.app_config (
  id int primary key check (id = 1),
  trial_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_config (id, trial_enabled)
values (1, true)
on conflict (id) do nothing;

drop trigger if exists set_app_config_updated_at on public.app_config;
create trigger set_app_config_updated_at
before update on public.app_config
for each row execute function public.set_updated_at();

-- Replace new-user handler to include trial dates when enabled
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  trial_on boolean;
begin
  select trial_enabled into trial_on from public.app_config where id = 1;

  insert into public.profiles (
    id,
    email,
    plan,
    trial_started_at,
    trial_ends_at,
    trial_consumed
  )
  values (
    new.id,
    new.email,
    'free',
    case when coalesce(trial_on, false) then now() else null end,
    case when coalesce(trial_on, false) then now() + interval '7 days' else null end,
    case when coalesce(trial_on, false) then true else false end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Ensure trigger points to updated function
-- (if already exists, keep it)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
