export type CsvDelimiter = "auto" | "," | ";" | "\t" | "|";

export type CsvImportOptions = {
  header: boolean;
  delimiter: CsvDelimiter;
};

export const DEFAULT_CSV_OPTIONS: CsvImportOptions = {
  header: true,
  delimiter: "auto",
};

const DEFAULT_SAMPLE_SIZE = 20000;
const DELIMITER_CANDIDATES: CsvDelimiter[] = [",", ";", "\t", "|"];

export function resolveCsvDelimiter(
  line: string,
  delimiter: CsvDelimiter
): CsvDelimiter {
  if (delimiter !== "auto") {
    return delimiter;
  }
  let best: { delimiter: CsvDelimiter; score: number } | null = null;
  for (const candidate of DELIMITER_CANDIDATES) {
    const score = countDelimiter(line, candidate);
    if (!best || score > best.score) {
      best = { delimiter: candidate, score };
    }
  }
  return !best || best.score === 0 ? "," : best.delimiter;
}

export function normalizeCsvHeaders(headers: string[]) {
  const seen = new Map<string, number>();
  return headers.map((value, index) => {
    const trimmed = value.trim().replace(/^\uFEFF/, "");
    let base = trimmed.length ? trimmed : `column_${index + 1}`;
    let count = seen.get(base) ?? 0;
    if (count > 0) {
      count += 1;
      seen.set(base, count);
      base = `${base}_${count}`;
    } else {
      seen.set(base, 1);
    }
    return base;
  });
}

function countDelimiter(line: string, delimiter: CsvDelimiter) {
  let count = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && char === delimiter) {
      count += 1;
    }
  }
  return count;
}
export function buildReadCsvAutoSql(
  fileName: string,
  options: CsvImportOptions
) {
  const parts = [
    `header=${options.header ? "true" : "false"}`,
    `sample_size=${DEFAULT_SAMPLE_SIZE}`,
    "all_varchar=true",
    "strict_mode=false",
    "null_padding=true",
    "ignore_errors=true",
  ];
  if (options.delimiter !== "auto") {
    const delimiter =
      options.delimiter === "\t" ? "\t" : options.delimiter;
    parts.push(`delim='${delimiter}'`);
  }
  return `SELECT * FROM read_csv_auto('${fileName}', ${parts.join(", ")})`;
}
