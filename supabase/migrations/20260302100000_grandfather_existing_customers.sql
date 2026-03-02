with existing_customers as (
  select p.id
  from public.profiles p
  where not exists (
    select 1
    from public.subscriptions s
    where s.owner_user_id = p.id
       or s.user_id = p.id
  )
),
inserted_subscriptions as (
  insert into public.subscriptions (
    user_id,
    owner_user_id,
    provider,
    status,
    plan_code,
    seat_limit,
    billing_interval,
    cancel_at_period_end
  )
  select
    c.id,
    c.id,
    'manual',
    'active',
    'individual',
    1,
    'month',
    false
  from existing_customers c
  returning owner_user_id
)
update public.profiles
set plan = 'pro',
    billing_role = 'owner'
where id in (select owner_user_id from inserted_subscriptions);
