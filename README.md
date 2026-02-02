# FileSQL

FileSQL is a local-first, browser-based SQL console powered by DuckDB-WASM. Query CSV and XLSX locally with safe preview defaults and export to CSV without uploading data.

## Setup

1) Install dependencies:

```bash
npm install
```

2) Create a `.env.local` file with Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
TRIAL_ENABLED=true
NEXT_PUBLIC_TRIAL_ENABLED=true
```

3) Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000.

Optional: run tests

```bash
npm test
```

## Notes

- FileSQL runs DuckDB-WASM inside a Web Worker. Files never leave your machine by default.
- The backend is used only for authentication and plan metadata.
- Exports use DuckDB COPY and do not rely on rendering results in the UI.
- XLSX parsing is done in a dedicated worker to avoid blocking the UI; avoid importing untrusted spreadsheets.

## Billing (Paddle later)

FileSQL is prepared for a future Paddle integration, but checkout is not implemented yet.

### How billing will work

- Plans live in `src/billing/plan.ts` as the single source of truth.
- User profiles store the current plan (`free` or `pro`).
- Paddle webhooks (later) will update `subscriptions` and set `profiles.plan`.

### Supabase tables

- `profiles`: user metadata + plan
- `subscriptions`: provider status (stubbed for Paddle)

### Edge functions (stubs)

- `supabase/functions/paddle-webhook`:
  - TODO: verify Paddle signature
  - TODO: map event types
  - Updates `subscriptions` and `profiles.plan`
- `supabase/functions/billing-dev-toggle`:
  - DEV ONLY: toggles plan for the logged-in user
  - Requires `DEV_BILLING_BYPASS=true`

### DEV plan toggle

Set env vars and call the edge function with your auth token:

```
DEV_BILLING_BYPASS=true
```

Then POST `{ "plan": "pro" }` to `/functions/v1/billing-dev-toggle` with your user token.

## QA checklist

- Import two CSVs, navigate to Settings, return to Console → tables still present.
- Run a query immediately after import → no “no such table” errors.
- Export shows the exact export row count and matches the downloaded file.
- Saved queries count matches usage and excludes deleted.
- Editor and Results heights remain stable; Results scrolls internally.
- Attach XLSX with two sheets; select sheet and confirm detected range.
- Import sheet with a stray cell to the right; verify stray is ignored.
- Manual range selection works and imported table is queryable immediately.
