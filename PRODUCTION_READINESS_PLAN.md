# Production Readiness Sweep Plan

## Root Cause Hypotheses
- Upgrade modal triggers from duplicated attachment totals and uses stale sessionImportedTables instead of a single attachedFiles source.
- Restore banner shows because it only checks for any stored file handles, not whether attachments exist or permissions are granted.
- Docs navigation routes to marketing (/#docs), which resets app layout/auth context and feels like sign-out.
- XLSX wizard uses detected range but header row index defaults to range start and preview rows are limited, so header names fall back to col_*. Header row selection is not applied when importing.
- CSV import uses a hard-coded read_csv path and can yield zero-row tables with certain CSVs; no integration sanity test catches it.
- Plan caps and plan display are scattered across lib/plans, components, and UI CTAs; Pro state is not reflected in upgrade CTAs.

## Files to Change
- Session/attachments: src/components/ConsoleSessionProvider.tsx, src/duckdb/runtimeCache.ts, src/db/indexeddb.ts, src/components/WorkspaceEditor.tsx
- Plan caps: src/lib/planCaps.ts (new), src/lib/plans.ts, src/config/plan.ts, src/components/SettingsView.tsx, src/components/Sidebar.tsx, src/components/Marketing/PricingSection.tsx
- Docs routing/nav: src/components/Sidebar.tsx, app/app/docs/page.tsx, app/app/layout.tsx (confirm auth wrap)
- XLSX wizard: src/components/XlsxImportWizard.tsx, src/lib/xlsxTable.ts, src/lib/range.ts (if needed)
- CSV import: src/duckdb/client.ts, src/duckdb/csv.ts, tests/csvImport.e2e.test.ts (or equivalent), tests/fixtures/sample.csv
- Tests: tests/xlsxHeaders.test.ts, tests/csvImport.e2e.test.ts

## Sequence
1. Centralize plan caps and attachment state in ConsoleSessionProvider; update upgrade modal checks and restore banner logic.
2. Add /app/docs page and update sidebar navigation to use /app/docs; ensure auth layout wraps app routes.
3. Fix XLSX wizard range/header state and import logic; ensure header row index is used and defaults are safe.
4. Improve CSV import reliability and add CSV fixture test; add XLSX header extraction unit test.
5. Update pricing/settings UI to reflect current plan and CTA changes; clean up dead code and build errors.
