import type { XlsxCell } from "@/src/lib/xlsxTable";

export function extractHeaderNames(
  rows: XlsxCell[][],
  headerRowIndex: number,
  rangeStartRow: number
) {
  const relativeIndex = headerRowIndex - rangeStartRow;
  const headerRow = rows[relativeIndex] ?? [];
  return headerRow.map((cell) =>
    cell === null || cell === undefined ? "" : String(cell).trim()
  );
}

export function sanitizeColumnName(name: string, fallback: string) {
  const trimmed = name.trim();
  let sanitized = trimmed
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!sanitized) {
    sanitized = fallback;
  }
  if (/^\d/.test(sanitized)) {
    sanitized = `_${sanitized}`;
  }
  return sanitized.toLowerCase();
}

export function dedupeColumnNames(names: string[]) {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const count = (seen.get(name) ?? 0) + 1;
    seen.set(name, count);
    return count === 1 ? name : `${name}_${count}`;
  });
}

export function getFinalColumnNames(
  rows: XlsxCell[][],
  headerEnabled: boolean,
  headerRowIndex: number | null,
  rangeStartRow: number,
  columnCount?: number
) {
  const derivedCount =
    columnCount && columnCount > 0
      ? columnCount
      : Math.max(0, ...rows.map((row) => row.length));
  if (derivedCount === 0) {
    return [];
  }
  if (!headerEnabled || headerRowIndex === null) {
    return Array.from({ length: derivedCount }, (_, index) => `col_${index + 1}`);
  }
  const rawHeaders = extractHeaderNames(rows, headerRowIndex, rangeStartRow);
  const padded = Array.from({ length: derivedCount }, (_, index) =>
    rawHeaders[index] ?? ""
  );
  const sanitized = padded.map((value, index) =>
    sanitizeColumnName(value, `col_${index + 1}`)
  );
  return dedupeColumnNames(sanitized);
}

export function finalizeColumnNamesFromOverrides(
  overrides: string[],
  columnCount: number
) {
  const padded = Array.from({ length: columnCount }, (_, index) =>
    overrides[index] ?? `col_${index + 1}`
  );
  const sanitized = padded.map((value, index) =>
    sanitizeColumnName(String(value ?? ""), `col_${index + 1}`)
  );
  return dedupeColumnNames(sanitized);
}

export function buildColumnsAndRows(
  rows: XlsxCell[][],
  options: {
    headerEnabled: boolean;
    headerRowIndex: number | null;
    rangeStartRow: number;
    columnCount?: number;
  }
) {
  if (!rows.length) {
    return { columns: [], dataRows: [] };
  }
  const columns = getFinalColumnNames(
    rows,
    options.headerEnabled,
    options.headerRowIndex,
    options.rangeStartRow,
    options.columnCount
  );
  const relativeHeaderIndex =
    options.headerEnabled && options.headerRowIndex !== null
      ? options.headerRowIndex - options.rangeStartRow
      : null;
  const dataStart =
    relativeHeaderIndex !== null &&
    relativeHeaderIndex >= 0 &&
    relativeHeaderIndex < rows.length
      ? relativeHeaderIndex + 1
      : 0;
  const dataRows = rows.slice(dataStart).map((row) =>
    columns.map((_, index) => row[index] ?? null)
  );
  return { columns, dataRows };
}
