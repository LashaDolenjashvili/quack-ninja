# Release Checklist (Manual QA)

Use this list before a production deploy.

## Auth + trial
- Sign up a new account → see “Pro trial” badge + countdown.
- Settings shows plan, trial start/end, and limits table.
- Trial ending banner shows when trial is near end (if test is configured).

## Imports
- Attach CSV:
  - Preview appears.
  - Table shows in schema.
  - Query runs.
- Attach Excel (.xlsx):
  - Sheet selection works.
  - Preview appears.
  - Import succeeds.
- Attach Parquet:
  - Preview appears.
  - Import succeeds.

## Query + results
- Run a simple query → results render.
- Run a query with LIMIT → label shows LIMIT.
- Run a query without LIMIT → preview mode is applied.

## Export
- Export uses current query only.
- Export respects plan cap (Free vs Pro).
- Large export shows a helpful warning (no crash).

## Persistence
- Refresh Console → tables restore from handles.
- If handle missing → “Reattach” prompt shown.

## Limits
- Free: file size + session size limits block correctly.
- Free: saved queries cap enforced.
- Pro: no upgrade modals; only neutral warnings.

## UX checks
- Open Console buttons are green with white text.
- Footer contrast is readable.
- No technical terms in landing/docs copy.
