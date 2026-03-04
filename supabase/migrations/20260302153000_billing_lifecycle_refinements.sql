alter table public.subscriptions
  add column if not exists auto_renew boolean not null default true,
  add column if not exists renewal_mode text not null default 'auto',
  add column if not exists pending_plan_code text,
  add column if not exists change_effective_at timestamptz,
  add column if not exists change_type text;

alter table public.subscriptions
  drop constraint if exists subscriptions_renewal_mode_check;

alter table public.subscriptions
  add constraint subscriptions_renewal_mode_check
  check (renewal_mode in ('auto', 'end_of_term'));

alter table public.subscriptions
  drop constraint if exists subscriptions_pending_plan_code_check;

alter table public.subscriptions
  add constraint subscriptions_pending_plan_code_check
  check (
    pending_plan_code is null
    or pending_plan_code in ('individual', 'team_5', 'team_10', 'team_unlimited')
  );

alter table public.subscriptions
  drop constraint if exists subscriptions_change_type_check;

alter table public.subscriptions
  add constraint subscriptions_change_type_check
  check (
    change_type is null
    or change_type in ('upgrade', 'downgrade', 'switch', 'renewal')
  );

update public.subscriptions
set auto_renew = case
      when provider = 'manual' then false
      when cancel_at_period_end then false
      else true
    end,
    renewal_mode = case
      when provider = 'manual' then 'end_of_term'
      when cancel_at_period_end then 'end_of_term'
      else 'auto'
    end
where auto_renew is distinct from case
      when provider = 'manual' then false
      when cancel_at_period_end then false
      else true
    end
   or renewal_mode is distinct from case
      when provider = 'manual' then 'end_of_term'
      when cancel_at_period_end then 'end_of_term'
      else 'auto'
    end;

update public.subscriptions
set pending_plan_code = null,
    change_effective_at = null,
    change_type = null
where pending_plan_code is not null
   or change_effective_at is not null
   or change_type is not null;
