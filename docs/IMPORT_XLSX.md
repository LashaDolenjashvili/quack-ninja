# XLSX Import Flow

## Pipeline Overview
- UI: `src/components/XlsxImportWizard.tsx` collects sheet, range, header row, and column overrides.
- Parser: `src/lib/xlsxWorker.ts` → `src/workers/xlsxParser.worker.ts` uses SheetJS to return preview rows, used range, or range rows.
- Import: `src/components/WorkspaceEditor.tsx` calls `duckdb.attachXlsx(...)` with final column names and row data.
- DuckDB: `src/duckdb/client.ts` creates the table schema and inserts rows in batches.

## Where Column Names Are Determined
- `src/lib/tabular/headers.ts` is the single source of truth for header extraction, sanitization, and deduping.
- The wizard uses `getFinalColumnNames(...)` for preview/column lists and stores overrides.
- The import path uses `buildColumnsAndRows(...)` + `finalizeColumnNamesFromOverrides(...)` so the DuckDB table schema matches the header row selection.
