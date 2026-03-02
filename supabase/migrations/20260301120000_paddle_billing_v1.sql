alter table public.profiles
  add column if not exists billing_role text not null default 'none'
  check (billing_role in ('none', 'owner', 'member'));

alter table public.subscriptions
  add column if not exists owner_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists plan_code text,
  add column if not exists seat_limit integer,
  add column if not exists paddle_product_id text,
  add column if not exists paddle_price_id text,
  add column if not exists billing_interval text not null default 'month',
  add column if not exists currency_code text,
  add column if not exists amount_cents integer,
  add column if not exists paddle_checkout_id text;

update public.subscriptions
set owner_user_id = coalesce(owner_user_id, user_id),
    plan_code = coalesce(plan_code, 'individual'),
    seat_limit = coalesce(seat_limit, 1)
where owner_user_id is null
   or plan_code is null
   or seat_limit is null;

alter table public.subscriptions
  alter column owner_user_id set not null,
  alter column plan_code set not null;

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_code_check;

alter table public.subscriptions
  add constraint subscriptions_plan_code_check
  check (plan_code in ('individual', 'team_5', 'team_10', 'team_unlimited'));

create index if not exists subscriptions_owner_user_id_idx
  on public.subscriptions(owner_user_id);

create unique index if not exists subscriptions_provider_subscription_id_idx
  on public.subscriptions(provider_subscription_id)
  where provider_subscription_id is not null;

create table if not exists public.subscription_members (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  member_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists subscription_members_subscription_member_idx
  on public.subscription_members(subscription_id, member_user_id);

create unique index if not exists subscription_members_member_user_idx
  on public.subscription_members(member_user_id);

create index if not exists subscription_members_owner_user_idx
  on public.subscription_members(owner_user_id);

alter table public.subscription_members enable row level security;

drop policy if exists "Subscription members are viewable by owner or member" on public.subscription_members;
create policy "Subscription members are viewable by owner or member"
on public.subscription_members for select
using (auth.uid() = owner_user_id or auth.uid() = member_user_id);

drop policy if exists "Profiles are updatable by the owner (no plan or trial changes)" on public.profiles;
create policy "Profiles are updatable by the owner (no plan, trial, or billing role changes)"
on public.profiles for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and plan = (select plan from public.profiles where id = auth.uid())
  and is_admin = (select is_admin from public.profiles where id = auth.uid())
  and billing_role = (select billing_role from public.profiles where id = auth.uid())
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
