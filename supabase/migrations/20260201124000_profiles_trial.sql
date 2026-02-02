alter table public.profiles
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists trial_consumed boolean not null default false;

create index if not exists profiles_trial_ends_at_idx on public.profiles(trial_ends_at);

-- Ensure owners cannot change plan or trial fields directly.
drop policy if exists "Profiles are updatable by the owner (no plan changes)" on public.profiles;
create policy "Profiles are updatable by the owner (no plan or trial changes)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and plan = (select plan from public.profiles where id = auth.uid())
    and is_admin = (select is_admin from public.profiles where id = auth.uid())
    and trial_started_at is not distinct from (
      select trial_started_at from public.profiles where id = auth.uid()
    )
    and trial_ends_at is not distinct from (
      select trial_ends_at from public.profiles where id = auth.uid()
    )
    and trial_consumed is not distinct from (
      select trial_consumed from public.profiles where id = auth.uid()
    )
  );
