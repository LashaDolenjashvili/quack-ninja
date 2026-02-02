create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null default 'paddle',
  provider_customer_id text,
  provider_subscription_id text,
  status text not null default 'inactive' check (status in ('active', 'inactive', 'past_due', 'canceled')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

drop policy if exists "Subscriptions are viewable by the owner" on public.subscriptions;
create policy "Subscriptions are viewable by the owner"
on public.subscriptions for select
using (auth.uid() = user_id);

drop policy if exists "Profiles are updatable by the owner (no plan changes)" on public.profiles;
create policy "Profiles are updatable by the owner (no plan changes)"
on public.profiles for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and plan = (select plan from public.profiles where id = auth.uid())
  and is_admin = (select is_admin from public.profiles where id = auth.uid())
);

-- NOTE: Subscription-driven plan updates should be done via service role
-- (Supabase Edge Functions). Profiles.plan should be updated after webhooks.
