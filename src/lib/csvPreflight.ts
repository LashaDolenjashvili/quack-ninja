import { resolveCsvDelimiter, type CsvDelimiter } from "@/src/duckdb/csv";

const SAMPLE_BYTES = 64 * 1024;
const MAX_PREVIEW_ROWS = 20;

export type CsvPreflight = {
  delimiterGuess: CsvDelimiter;
  headerGuess: boolean;
  columnCount: number;
  warnings: string[];
  sampleLines: string[];
};

export async function preflightCsv(file: File): Promise<CsvPreflight> {
  const slice = file.slice(0, SAMPLE_BYTES);
  let text = "";
  try {
    text = await slice.text();
  } catch {
    text = "";
  }
  const cleaned = text.replace(/\0/g, "");
  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.replace(/^\uFEFF/, ""))
    .filter((line) => line.trim().length > 0);
  const sampleLines = lines.slice(0, MAX_PREVIEW_ROWS);
  const firstLine = sampleLines[0] ?? "";
  const delimiterGuess = resolveCsvDelimiter(firstLine, "auto");
  const previewRows = buildPreviewRows(sampleLines, delimiterGuess);
  const columnCount = previewRows[0]?.length ?? 0;
  const warnings: string[] = [];
  const columnCounts = new Set(previewRows.map((row) => row.length));
  if (columnCounts.size > 1) {
    warnings.push(
      "Sample rows have inconsistent column counts. Check delimiter or quoted fields."
    );
  }
  const headerGuess = guessHeader(previewRows);
  return {
    delimiterGuess,
    headerGuess,
    columnCount,
    warnings,
    sampleLines,
  };
}

export function buildPreviewRows(
  lines: string[],
  delimiter: CsvDelimiter
) {
  return lines.map((line) => parseCsvLine(line, delimiter));
}

function guessHeader(rows: string[][]) {
  if (rows.length === 0) {
    return true;
  }
  const [first, second] = rows;
  const firstHasAlpha = first?.some((value) => /[a-zA-Z]/.test(value)) ?? false;
  if (!second) {
    return firstHasAlpha;
  }
  const secondMostlyNumeric = second.every((value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return true;
    }
    return /^-?\d+(\.\d+)?$/.test(trimmed);
  });
  return firstHasAlpha && secondMostlyNumeric;
}

function parseCsvLine(line: string, delimiter: CsvDelimiter) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && char === delimiter) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}
