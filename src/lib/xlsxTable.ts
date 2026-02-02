export type XlsxCell = string | number | boolean | null | Date;

export function normalizeHeaders(headers: string[]) {
  const seen = new Map<string, number>();
  return headers.map((header, index) => {
    const base = header
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/^_+|_+$/g, "");
    const normalized = base || `col_${index + 1}`;
    const count = (seen.get(normalized) ?? 0) + 1;
    seen.set(normalized, count);
    return count === 1 ? normalized : `${normalized}_${count}`;
  });
}

export function extractXlsxTable(rows: XlsxCell[][]) {
  const minHeaderCells = 3;
  const maxEmptyRows = 2;
  const emptyCell = (value: unknown) =>
    value === null || value === undefined || String(value).trim() === "";

  let headerRowIndex = rows.findIndex((row) => {
    const filled = row.filter((cell) => !emptyCell(cell)).length;
    return filled >= minHeaderCells;
  });
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
  }

  const headerRow = rows[headerRowIndex] ?? [];
  const dataStart = headerRowIndex + 1;
  let lastDataRow = rows.length - 1;
  let emptyStreak = 0;
  for (let i = dataStart; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const hasData = row.some((cell) => !emptyCell(cell));
    if (hasData) {
      emptyStreak = 0;
      lastDataRow = i;
    } else {
      emptyStreak += 1;
      if (emptyStreak >= maxEmptyRows) {
        break;
      }
    }
  }

  const dataRows = rows.slice(dataStart, lastDataRow + 1);
  const maxColCount = Math.max(
    headerRow.length,
    ...dataRows.map((row) => row.length)
  );
  const fillCounts = new Array(maxColCount).fill(0);
  if (dataRows.length > 0) {
    for (const row of dataRows) {
      for (let i = 0; i < maxColCount; i += 1) {
        if (!emptyCell(row[i])) {
          fillCounts[i] += 1;
        }
      }
    }
  }
  const densityThreshold = 0.1;
  let lastColIndex = -1;
  for (let i = 0; i < maxColCount; i += 1) {
    const headerHasValue = !emptyCell(headerRow[i]);
    const density =
      dataRows.length > 0 ? fillCounts[i] / dataRows.length : 0;
    if (headerHasValue || density >= densityThreshold) {
      lastColIndex = i;
    }
  }
  if (lastColIndex < 0) {
    lastColIndex = Math.max(headerRow.length - 1, 0);
  }

  const columns = Array.from({ length: lastColIndex + 1 }, (_, index) => {
    const value = headerRow[index];
    const label =
      value === null || value === undefined || String(value).trim() === ""
        ? `column_${index + 1}`
        : String(value);
    return label;
  });
  const normalizedRows = dataRows.map((row) =>
    columns.map((_, index) => row[index] ?? null)
  );
  return { columns, dataRows: normalizedRows };
}
