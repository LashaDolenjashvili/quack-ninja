# Trial testing checklist

## Setup

- Ensure env vars are set:
  - `TRIAL_ENABLED=true`
  - `NEXT_PUBLIC_TRIAL_ENABLED=true` (for landing page visibility)
  - `SUPABASE_SERVICE_ROLE_KEY` (server entitlement + trial creation)

## Create a new account

1) Sign up with a brand‑new email.
2) Confirm the signup page shows the trial note.
3) After signup, you should land in the Console with a “Pro trial” badge.

## Verify in Supabase

Run this SQL in Supabase:

```sql
select id, plan, trial_started_at, trial_ends_at, trial_consumed
from profiles
where email = 'you@example.com';
```

- `trial_started_at` and `trial_ends_at` should be set.
- `trial_consumed` should be true.

## Verify entitlements

Call the endpoint with your auth token:

```
GET /api/me/entitlements
```

Expect:
- `plan: "pro"`
- `is_trial_active: true`
- `trial_ends_at` about 7 days in the future

## Fast‑forward test

Option A (SQL):

```sql
update profiles
set trial_ends_at = now() - interval '1 day'
where email = 'you@example.com';
```

Then refresh the app:
- Plan should be Free
- Trial badge should disappear

Option B (dev override):
- Set `TRIAL_DURATION_SECONDS=120`
- Sign up with a new account
- Trial should end in ~2 minutes

## Reset trial (local dev only)

Use the script:

```bash
node --import tsx scripts/reset-trial.ts --email you@example.com
```

This clears trial fields for a test user so you can re‑run the flow.
