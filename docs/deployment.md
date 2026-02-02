# QuackNinja Deployment (Vercel)

This checklist keeps production safe and consistent. It assumes you deploy the Next.js app to Vercel and use Supabase for auth + DB.

## 1) Required environment variables

Set these in Vercel → Project → Settings → Environment Variables:

Client-safe (public):
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
- `NEXT_PUBLIC_TRIAL_ENABLED` — `true` or `false`
- `NEXT_PUBLIC_TRIAL_DURATION_SECONDS` — optional (dev/testing only)
- `NEXT_PUBLIC_SHOW_TRIAL_DEBUG` — optional (dev/testing only)

Server-only (never public):
- `SUPABASE_SERVICE_ROLE_KEY` — service role key for server routes
- `SUPABASE_URL` — optional fallback if you don’t want to re-use NEXT_PUBLIC
- `TRIAL_ENABLED` — `true` or `false`
- `TRIAL_DURATION_SECONDS` — optional (dev/testing only)

Notes:
- Do not expose the service role key as a `NEXT_PUBLIC_*` var.
- `NEXT_PUBLIC_*` vars are bundled into the client.

## 2) Supabase migration

Apply the migration(s) in `supabase/migrations/`:
- profiles + trial fields
- trial config + trigger

Confirm the trigger sets trial dates on first profile creation when trials are enabled.

## 3) Build & deploy

From the repo root:

```bash
npm run build
```

Or if using pnpm:

```bash
pnpm build
```

Then deploy via Vercel UI or CLI.

## 4) Domain & HTTPS

- Configure your domain in Vercel.
- Ensure HTTPS is active.

## 5) Smoke test after deploy

1) Sign up → confirm Pro trial badge + countdown.
2) Attach CSV (small file) → run query → export CSV.
3) Attach Excel + Parquet (if enabled) → preview + import.
4) Verify Free vs Pro limits are enforced.
5) Refresh Console → attached tables are restored (if file handles available).

## 6) If something fails

- Check Vercel logs for `/api/me/entitlements` and `/api/me/start-trial`.
- Verify Supabase env vars are present in the correct scope (Production + Preview).
- Ensure your Supabase URL and anon key are correct.
