# FileSQL Quality Report

## Build Status
- build: not run (manual run recommended)
- lint: not run (manual run recommended)
- typecheck: added `npm run typecheck` (not run)
- tests: not run (manual run recommended)

## What I Found
- CSV import had multiple competing code paths and accidental complexity from the CSV settings experiment.
- Duplicate XLSX header normalization/type inference logic lived in multiple components.
- Missing error boundary for the Console view.
- Missing `typecheck` script.

## What I Changed
- Restored the legacy CSV import flow to a single deterministic path using `registerFileBuffer` and `read_csv` with fixed settings, plus explicit row-count validation and debug info. (`src/duckdb/client.ts`)
- Removed CSV settings UI influence and related call signatures, reducing hidden state. (`src/components/AttachFileModal.tsx`, `src/components/WorkspaceEditor.tsx`)
- Added a shared sanitizer utility and a unit test. (`src/lib/sanitize.ts`, `tests/sanitize.test.ts`)
- Centralized XLSX header normalization + type inference in `src/lib/xlsxTable.ts` and removed duplicates in components.
- Added a Console error boundary for resilience. (`app/app/console/error.tsx`)
- Added `typecheck` script. (`package.json`)

## Remaining TODO (intentional)
- Add a worker-capable integration test for CSV import to assert `COUNT(*) > 0`. Current test runner is Node-only and not configured for DuckDB-WASM worker execution.
- Run `npm run build`, `npm run lint`, and `npm run typecheck` locally to confirm full CI readiness.

## Suggested Verification Commands
```bash
npm run typecheck
npm run lint
npm run test
npm run build
```
