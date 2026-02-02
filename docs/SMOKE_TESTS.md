# Smoke Tests

Manual checklist for regression verification.

## Auth
- Sign in.
- Sign out.

## CSV flow
- Attach a small CSV; confirm the table exists.
- Run a SELECT query on the small CSV table.
- Export results to CSV.
- Attach a medium CSV; confirm the table exists.
- Run a SELECT query on the medium CSV table.
- Export results to CSV.

## Table management
- Rename a table.
- Copy a table.
- Drop a table.

## Saved queries
- Save a query.
- Load the saved query.
- Delete the saved query.

## Plan limits
- Free: block attach >25MB and >100MB total session.
- Free: preview capped to 1,000 rows; export capped to 1,000 rows.
- Free: saved queries capped at 3.
- Pro: allow attach up to 1GB and 2GB session.
- Pro: preview capped to 10,000 rows; export capped to 500,000 rows.
- Pro: no upgrade modal when hitting limits.

## Auto-limit banner
- Confirm the auto-limit banner appears when expected.
- Confirm the banner behavior matches current CSV flow expectations.
