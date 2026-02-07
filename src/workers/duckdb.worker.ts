/// <reference lib="webworker" />

import * as duckdb from "@duckdb/duckdb-wasm";
import * as arrow from "apache-arrow";
import * as XLSX from "xlsx";
import { localDuckDbBundles } from "@/src/duckdb/bundles";
import { resolveCsvDelimiter } from "@/src/duckdb/csv";
import { sanitizeFileName } from "@/src/lib/sanitize";
import { buildColumnsAndRows } from "@/src/lib/tabular/headers";
import { trimTrailingEmptyColumns, type XlsxCell } from "@/src/lib/xlsxTable";
import type {
  AttachedTable,
  CopyTablePayload,
  CsvImportPayload,
  CsvInferPayload,
  ExportQueryPayload,
  ExportResult,
  ParquetImportPayload,
  XlsxImportPayload,
  QueryPayload,
  QueryResult,
  RenameTablePayload,
  TableNamePayload,
  WorkerMessageType,
  WorkerRequest,
  WorkerResponse,
  WorkerProgress,
  WorkspacePayload,
  XlsxAttachPayload,
  XlsxCreatePayload,
  XlsxInsertPayload,
  XlsxPreviewPayload,
  XlsxPreviewResult,
  ParquetPreviewPayload,
  ParquetPreviewResult,
} from "@/src/lib/duckdb-worker-types";

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;

let db: duckdb.AsyncDuckDB | null = null;
const connections = new Map<string, duckdb.AsyncDuckDBConnection>();

let BASE_URL: string | null = null;
const XLSX_MAX_IMPORT_COLUMNS = 2048;
const XLSX_MAX_IMPORT_CELLS = 10_000_000;

function abs(pathname: string) {
  if (/^(https?:|blob:|data:)/.test(pathname)) return pathname;

  const base = BASE_URL ?? self.location?.origin;
  if (!base || base === "null") {
    throw new Error("No valid base URL for DuckDB assets.");
  }
  return new URL(pathname, base).toString();
}



function sendResponse<T>(response: WorkerResponse<T>, transfer?: Transferable[]) {
  if (transfer?.length) {
    ctx.postMessage(response, transfer);
    return;
  }
  ctx.postMessage(response);
}

function sendProgress(
  id: string,
  type: WorkerMessageType,
  stage: string,
  percent?: number
) {
  const progress: WorkerProgress = { stage, percent };
  sendResponse({ id, type, success: true, progress });
}

async function initializeDb(requestId?: string) {
  if (db) return;

  if (requestId) sendProgress(requestId, "init", "Loading DuckDB bundle...", 10);
  

  // Use local bundles that point to /duckdb/* in public, but make URLs absolute
  const bundle = await duckdb.selectBundle(localDuckDbBundles);

  if (!bundle.mainWorker) {
    throw new Error("DuckDB worker bundle is missing a main worker.");
  }
  if (!bundle.mainModule) {
    throw new Error("DuckDB bundle is missing a main module.");
  }

  const mainWorkerUrl = abs(bundle.mainWorker);
  const mainModuleUrl = abs(bundle.mainModule);
  const pthreadUrl = bundle.pthreadWorker ? abs(bundle.pthreadWorker) : undefined;

  if (requestId) sendProgress(requestId, "init", "Creating worker...", 30);

  // IMPORTANT: do NOT use { type: "module" } for DuckDB’s distributed worker script
  const worker = new Worker(mainWorkerUrl); // no { type: "module" }

  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);

  if (requestId) sendProgress(requestId, "init", "Instantiating database...", 60);

  await db.instantiate(mainModuleUrl, pthreadUrl);

  if (requestId) sendProgress(requestId, "init", "Ready", 100);
}


function assertDb() {
  if (!db) {
    throw new Error("DuckDB not initialized.");
  }
  return db;
}

async function getConnection(workspaceId: string) {
  const key = workspaceId || "local";
  if (!connections.has(key)) {
    const conn = await assertDb().connect();
    const schema = schemaName(key);
    await conn.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await conn.query(`SET search_path TO ${schema}`);
    connections.set(key, conn);
  }
  return connections.get(key)!;
}

function schemaName(workspaceId: string) {
  const safeId = workspaceId.replace(/[^a-z0-9_]/gi, "").slice(0, 12);
  return `ws_${safeId || "local"}`;
}

function quoteIdent(value: string) {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function toArrowText(value: XlsxCell) {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

function getInsertBatchSize(columnCount: number) {
  const targetCells = 120_000;
  const dynamicBatch = Math.floor(targetCells / Math.max(1, columnCount));
  return Math.max(10, Math.min(2_000, dynamicBatch));
}

function buildArrowBatchTable(columns: string[], rows: XlsxCell[][]) {
  const arrays: Record<string, (string | null)[]> = {};
  for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
    const columnName = columns[columnIndex];
    const values = new Array<string | null>(rows.length);
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      values[rowIndex] = toArrowText(rows[rowIndex]?.[columnIndex] ?? null);
    }
    arrays[columnName] = values;
  }
  return arrow.tableFromArrays(arrays);
}

async function insertRowsAsArrowBatches(
  conn: duckdb.AsyncDuckDBConnection,
  tableName: string,
  columns: string[],
  rows: XlsxCell[][],
  onBatchInserted?: (current: number, total: number) => void
) {
  if (rows.length === 0) {
    return;
  }
  const batchSize = getInsertBatchSize(columns.length);
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const table = buildArrowBatchTable(columns, batch);
    await conn.insertArrowTable(table, {
      name: tableName,
      create: false,
    });
    onBatchInserted?.(Math.min(i + batch.length, rows.length), rows.length);
  }
}

async function importCsvLegacy(
  requestId: string,
  payload: CsvImportPayload
): Promise<AttachedTable> {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  const hasBuffer = Boolean(payload.buffer && payload.buffer.byteLength > 0);
  const hasFile = Boolean(payload.file);
  if (!hasBuffer && !hasFile) {
    throw new Error("CSV file is empty.");
  }
  const fileKey = `imports/${crypto.randomUUID()}-${sanitizeFileName(
    payload.fileName
  )}`;
  let registered = false;
  const { previewText, firstLine } = hasBuffer
    ? await readCsvSample(payload.buffer as ArrayBuffer)
    : await readCsvSampleFromFile(payload.file as File);
  try {
    sendProgress(requestId, "importCsvLegacy", "Registering file...", 20);
    if (hasFile) {
      await assertDb().registerFileHandle(
        fileKey,
        payload.file as File,
        duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
        true
      );
    } else {
      const bytes = new Uint8Array(payload.buffer as ArrayBuffer);
      await assertDb().registerFileBuffer(fileKey, bytes);
    }
    registered = true;

    const delimiter = resolveCsvDelimiter(
      firstLine,
      payload.options?.delimiter ?? "auto"
    );
    const header = payload.options?.header ?? true;
    const readSql = buildReadCsvSql(fileKey, delimiter, header);
    let rowCount = 0;
    let columns: { name: string; type: string }[] = [];
    let finalSql = readSql;

    sendProgress(requestId, "importCsvLegacy", "Creating table...", 55);
    ({ rowCount, columns } = await createCsvTable(
      conn,
      payload.tableName,
      readSql
    ));

    if (rowCount === 0) {
      const autoSql = buildReadCsvAutoSql(fileKey, delimiter, header);
      finalSql = autoSql;
      ({ rowCount, columns } = await createCsvTable(
        conn,
        payload.tableName,
        autoSql
      ));
    }

    if (rowCount === 0) {
      throw new Error(
        `CSV import produced 0 rows. File key: ${fileKey}. SQL: ${finalSql}. Preview: ${previewText}`
      );
    }
    sendProgress(requestId, "importCsvLegacy", "Reading schema...", 85);
    return {
      tableName: payload.tableName,
      fileName: payload.fileName,
      rowCount,
      columns,
      csvDelimiter: delimiter,
      csvHeader: header,
    };
  } finally {
    if (registered) {
      try {
        await assertDb().dropFile(fileKey);
      } catch {
        // Ignore cleanup errors.
      }
    }
  }
}

async function inferCsvTypes(requestId: string, payload: CsvInferPayload) {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  const sampleSize = payload.sampleSize ?? 100;
  const { columns, columnTypes } = await inferTypesFromSample(
    conn,
    payload.tableName,
    sampleSize,
    requestId,
    "inferCsvTypes"
  );
  sendProgress(requestId, "inferCsvTypes", "Creating typed table", 85);
  await replaceWithTypedTable(conn, payload.tableName, columns, columnTypes);
  sendProgress(requestId, "inferCsvTypes", "Ready", 100);
  return {
    delimiter: payload.options?.delimiter ?? "auto",
  };
}

async function xlsxPreview(
  requestId: string,
  payload: XlsxPreviewPayload
): Promise<XlsxPreviewResult> {
  const previewRows = Math.min(50, Math.max(1, payload.previewRows));
  sendProgress(requestId, "xlsxPreview", "Reading workbook", 20);
  const workbook = XLSX.read(payload.buffer, { type: "array" });
  const sheet = workbook.Sheets[payload.sheetName];
  if (!sheet) {
    throw new Error("Sheet not found.");
  }

  const rangeStart = payload.range?.startRow ?? 1;
  const rangeEnd =
    payload.range?.endRow ??
    (payload.header ? previewRows + rangeStart : previewRows + rangeStart - 1);
  const dataEnd = payload.header
    ? rangeStart + previewRows
    : rangeStart + previewRows - 1;
  const effectiveEnd = Math.min(rangeEnd, dataEnd);
  const effectiveRange = {
    s: { r: Math.max(0, rangeStart - 1), c: 0 },
    e: { r: Math.max(0, effectiveEnd - 1), c: 0 },
  };
  const ref = sheet["!ref"];
  if (ref) {
    const decoded = XLSX.utils.decode_range(ref);
    effectiveRange.e.c = decoded.e.c;
  } else {
    effectiveRange.e.c = 0;
    effectiveRange.e.r = effectiveRange.s.r;
  }

  sendProgress(requestId, "xlsxPreview", "Building preview", 60);
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
    range: effectiveRange,
  }) as unknown[][];

  const headerRow = payload.header ? rows[0] ?? [] : [];
  const dataRows = payload.header ? rows.slice(1) : rows;
  const columnCount = Math.max(
    headerRow.length,
    ...dataRows.map((row) => row.length),
    0
  );
  const columns = Array.from({ length: columnCount }, (_, index) => {
    const headerValue = headerRow[index];
    const label =
      headerValue === null ||
      headerValue === undefined ||
      String(headerValue).trim() === ""
        ? `col_${index + 1}`
        : String(headerValue).trim();
    return label;
  });
  const normalizedRows = dataRows
    .slice(0, previewRows)
    .map((row) =>
      Array.from({ length: columnCount }, (_, index) => {
        const value = row[index];
        if (value === null || value === undefined) {
          return null;
        }
        if (typeof value === "number" || typeof value === "string") {
          return value;
        }
        return String(value);
      })
    );
  sendProgress(requestId, "xlsxPreview", "Ready", 100);
  return { columns, rows: normalizedRows };
}

function inferColumnTypes(
  rows: Record<string, unknown>[],
  columns: string[]
): string[] {
  const stats = columns.map(() => ({
    nonEmptyCount: 0,
    integerCount: 0,
    floatCount: 0,
    dateCount: 0,
    timestampCount: 0,
    epochSecondsCount: 0,
    epochMillisCount: 0,
    epochMicrosCount: 0,
    leadingZeroNumericCount: 0,
  }));

  for (const row of rows) {
    for (let i = 0; i < columns.length; i += 1) {
      const value = row[columns[i]];
      const text =
        value === null || value === undefined ? "" : String(value).trim();
      if (!text) {
        continue;
      }
      const cell = text;
      const entry = stats[i];
      entry.nonEmptyCount += 1;
      if (isIntegerValue(cell)) entry.integerCount += 1;
      if (isFloatValue(cell)) entry.floatCount += 1;
      if (isDateValue(cell)) entry.dateCount += 1;
      if (isTimestampValue(cell)) entry.timestampCount += 1;
      if (isEpochSecondsValue(cell)) entry.epochSecondsCount += 1;
      if (isEpochMillisValue(cell)) entry.epochMillisCount += 1;
      if (isEpochMicrosValue(cell)) entry.epochMicrosCount += 1;
      if (hasLeadingZeroNumeric(cell)) entry.leadingZeroNumericCount += 1;
    }
  }

  return stats.map((entry, index) => {
    if (entry.nonEmptyCount === 0) return "VARCHAR";
    const minNonEmpty = Math.max(3, Math.min(20, Math.ceil(rows.length * 0.2)));
    if (entry.nonEmptyCount < minNonEmpty) return "VARCHAR";
    const integerRatio = entry.integerCount / entry.nonEmptyCount;
    const floatRatio = entry.floatCount / entry.nonEmptyCount;
    const timestampRatio = entry.timestampCount / entry.nonEmptyCount;
    const dateRatio = entry.dateCount / entry.nonEmptyCount;
    const epochRatio =
      Math.max(
        entry.epochSecondsCount,
        entry.epochMillisCount,
        entry.epochMicrosCount
      ) / entry.nonEmptyCount;
    const numericConfidence = entry.nonEmptyCount < 100 ? 0.95 : 0.995;
    const dateConfidence = entry.nonEmptyCount < 100 ? 0.95 : 0.98;
    const likelyId = isLikelyIdentifierColumn(columns[index]);
    const likelyDateTime = isLikelyDateTimeColumn(columns[index]);
    const idRisk = likelyId && entry.leadingZeroNumericCount > 0;
    if (likelyDateTime && epochRatio >= dateConfidence) return "TIMESTAMP";
    if (timestampRatio >= dateConfidence) return "TIMESTAMP";
    if (dateRatio >= dateConfidence) return "DATE";
    if (!idRisk && integerRatio >= numericConfidence) return "BIGINT";
    if (!idRisk && floatRatio >= numericConfidence) return "DOUBLE";
    return "VARCHAR";
  });
}

function normalizeNumericValue(value: string) {
  let normalized = value.trim();
  if (!normalized) {
    return null;
  }
  let negative = false;
  if (/^\(.*\)$/.test(normalized)) {
    negative = true;
    normalized = normalized.slice(1, -1).trim();
  }
  normalized = normalized.replace(/[$€£¥₾]/g, "");
  normalized = normalized.replace(/,/g, "");
  normalized = normalized.replace(/\s+/g, "");
  if (!normalized) {
    return null;
  }
  if (negative) {
    normalized = `-${normalized}`;
  }
  return normalized;
}

function isIntegerValue(value: string) {
  const normalized = normalizeNumericValue(value);
  return normalized ? /^-?\d+$/.test(normalized) : false;
}

function isFloatValue(value: string) {
  const normalized = normalizeNumericValue(value);
  return normalized
    ? /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(normalized)
    : false;
}

function hasLeadingZeroNumeric(value: string) {
  const normalized = normalizeNumericValue(value);
  if (!normalized) {
    return false;
  }
  const unsigned = normalized.startsWith("-")
    ? normalized.slice(1)
    : normalized;
  return /^0\d+$/.test(unsigned);
}

function isLikelyIdentifierColumn(name: string) {
  return /(id|code|zip|postal|phone|account|invoice|order|sku|ssn|ein|uuid|guid|iban|routing|swift|tax)/i.test(
    name
  );
}

function isLikelyDateTimeColumn(name: string) {
  return /(date|time|timestamp|created|updated|deleted|birthday|dob|start|end)/i.test(
    name
  );
}

function isEpochSecondsValue(value: string) {
  const normalized = normalizeNumericValue(value);
  if (!normalized || !/^\d+$/.test(normalized)) {
    return false;
  }
  const num = Number(normalized);
  return Number.isFinite(num) && num >= 1_000_000_000 && num <= 9_999_999_999;
}

function isEpochMillisValue(value: string) {
  const normalized = normalizeNumericValue(value);
  if (!normalized || !/^\d+$/.test(normalized)) {
    return false;
  }
  const num = Number(normalized);
  return (
    Number.isFinite(num) &&
    num >= 1_000_000_000_000 &&
    num <= 9_999_999_999_999
  );
}

function isEpochMicrosValue(value: string) {
  const normalized = normalizeNumericValue(value);
  if (!normalized || !/^\d+$/.test(normalized)) {
    return false;
  }
  const num = Number(normalized);
  return (
    Number.isFinite(num) &&
    num >= 1_000_000_000_000_000 &&
    num <= 9_999_999_999_999_999
  );
}

function buildEpochAwareTimestampExpr(columnName: string) {
  const ident = quoteIdent(columnName);
  const numeric = `TRY_CAST(${ident} AS DOUBLE)`;
  return `COALESCE(
    TRY_CAST(${ident} AS TIMESTAMP),
    CASE
      WHEN ${numeric} BETWEEN 1000000000000000 AND 9999999999999999 THEN to_timestamp(${numeric} / 1000000.0)
      WHEN ${numeric} BETWEEN 1000000000000 AND 9999999999999 THEN to_timestamp(${numeric} / 1000.0)
      WHEN ${numeric} BETWEEN 1000000000 AND 9999999999 THEN to_timestamp(${numeric})
      ELSE NULL
    END
  )`;
}

function isDateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  return !Number.isNaN(Date.parse(value));
}

function isTimestampValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?$/.test(value)) {
    return false;
  }
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  return !Number.isNaN(Date.parse(normalized));
}

async function attachXlsx(payload: XlsxAttachPayload) {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  const types =
    payload.columnTypes && payload.columnTypes.length === payload.columns.length
      ? payload.columnTypes
      : [];
  await createXlsxTable(conn, payload.tableName, payload.columns, types);
  if (payload.rows.length === 0) {
    return;
  }
  await insertXlsxRows(conn, payload.tableName, payload.columns, payload.rows);
}

async function createXlsxTableForWorkspace(payload: XlsxCreatePayload) {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  await createXlsxTable(
    conn,
    payload.tableName,
    payload.columns,
    payload.columnTypes
  );
}

async function insertXlsxRowsForWorkspace(payload: XlsxInsertPayload) {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  await insertXlsxRows(conn, payload.tableName, payload.columns, payload.rows);
}

async function createXlsxTable(
  conn: duckdb.AsyncDuckDBConnection,
  tableName: string,
  columns: string[],
  columnTypes?: string[]
) {
  const types = columnTypes && columnTypes.length === columns.length ? columnTypes : [];
  const columnSql = columns
    .map((column, index) => {
      const type = types[index] ?? "VARCHAR";
      return `${quoteIdent(column)} ${type}`;
    })
    .join(", ");
  await conn.query(
    `CREATE OR REPLACE TABLE ${quoteIdent(tableName)} (${columnSql})`
  );
}

async function insertXlsxRows(
  conn: duckdb.AsyncDuckDBConnection,
  tableName: string,
  columns: string[],
  rows: XlsxCell[][],
  onBatchInserted?: (current: number, total: number) => void
) {
  if (rows.length === 0) {
    return;
  }
  await insertRowsAsArrowBatches(
    conn,
    tableName,
    columns,
    rows,
    onBatchInserted
  );
}

async function importParquet(
  requestId: string,
  payload: ParquetImportPayload
): Promise<AttachedTable> {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  const hasBuffer = Boolean(payload.buffer && payload.buffer.byteLength > 0);
  const hasFile = Boolean(payload.file);
  if (!hasBuffer && !hasFile) {
    throw new Error("Parquet file is empty.");
  }
  const fileKey = `imports/${crypto.randomUUID()}-${sanitizeFileName(
    payload.fileName
  )}`;
  const dbInstance = assertDb();
  sendProgress(requestId, "importParquet", "Registering file", 20);
  if (hasFile) {
    await dbInstance.registerFileHandle(
      fileKey,
      payload.file as File,
      duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
      true
    );
  } else {
    const bytes = new Uint8Array(payload.buffer as ArrayBuffer);
    await dbInstance.registerFileBuffer(fileKey, bytes);
  }
  sendProgress(requestId, "importParquet", "Creating table", 60);
  const sql = `SELECT * FROM read_parquet('${fileKey}')`;
  const { rowCount, columns } = await createCsvTable(
    conn,
    payload.tableName,
    sql
  );
  sendProgress(requestId, "importParquet", "Ready", 100);
  return {
    tableName: payload.tableName,
    fileName: payload.fileName,
    rowCount,
    columns,
  };
}

async function parquetPreview(
  requestId: string,
  payload: ParquetPreviewPayload
): Promise<ParquetPreviewResult> {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  if (payload.buffer.byteLength === 0) {
    throw new Error("Parquet file is empty.");
  }
  const fileKey = `previews/${crypto.randomUUID()}-${sanitizeFileName(
    payload.fileName
  )}`;
  const bytes = new Uint8Array(payload.buffer);
  try {
    sendProgress(requestId, "parquetPreview", "Registering file", 20);
    await assertDb().registerFileBuffer(fileKey, bytes);
    const limit = Math.min(50, Math.max(1, payload.previewRows));
    sendProgress(requestId, "parquetPreview", "Reading preview", 60);
    const result = await conn.query(
      `SELECT * FROM read_parquet('${fileKey}') LIMIT ${limit}`
    );
    const rawRows = result.toArray();
    const rows = rawRows.map((row) =>
      typeof row?.toJSON === "function" ? row.toJSON() : row
    );
    const columns = result.schema.fields.map((field) => field.name);
    sendProgress(requestId, "parquetPreview", "Ready", 100);
    return { columns, rows };
  } finally {
    try {
      await assertDb().dropFile(fileKey);
    } catch {
      // ignore cleanup errors
    }
  }
}

async function importXlsx(
  requestId: string,
  payload: XlsxImportPayload
): Promise<AttachedTable> {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  sendProgress(requestId, "importXlsx", "Parsing sheet", 20);
  const workbook = XLSX.read(payload.buffer, { type: "array" });
  const sheet = workbook.Sheets[payload.sheetName];
  if (!sheet) {
    throw new Error("Sheet not found.");
  }

  const rangeStart = payload.range?.startRow ?? 1;
  const rangeEnd = payload.range?.endRow ?? Number.MAX_SAFE_INTEGER;
  const effectiveRange = {
    s: { r: Math.max(0, rangeStart - 1), c: 0 },
    e: { r: Math.max(0, rangeEnd - 1), c: 0 },
  };
  const ref = sheet["!ref"];
  if (ref) {
    const decoded = XLSX.utils.decode_range(ref);
    effectiveRange.e.c = decoded.e.c;
    effectiveRange.e.r = Math.min(decoded.e.r, effectiveRange.e.r);
  } else {
    effectiveRange.e.c = 0;
    effectiveRange.e.r = effectiveRange.s.r;
  }

  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
    range: effectiveRange,
  }) as XlsxCell[][];
  const { rows, columnCount } = trimTrailingEmptyColumns(rawRows);
  if (columnCount > XLSX_MAX_IMPORT_COLUMNS) {
    throw new Error(
      `Selected Excel sheet resolves to ${columnCount.toLocaleString()} columns, above the ${XLSX_MAX_IMPORT_COLUMNS.toLocaleString()}-column import limit. Select a tighter range or clean stray cells.`
    );
  }
  const estimatedCells = rows.length * columnCount;
  if (estimatedCells > XLSX_MAX_IMPORT_CELLS) {
    throw new Error(
      `Selected Excel range is too large (${estimatedCells.toLocaleString()} cells). Reduce rows/columns or split the sheet before importing.`
    );
  }
  const { columns, dataRows } = buildColumnsAndRows(rows, {
    headerEnabled: payload.header,
    headerRowIndex: payload.header ? rangeStart - 1 : null,
    rangeStartRow: rangeStart - 1,
    columnCount,
  });
  if (columns.length === 0) {
    throw new Error("No columns found in the selected sheet.");
  }

  sendProgress(requestId, "importXlsx", "Creating table", 40);
  await createXlsxTable(
    conn,
    payload.tableName,
    columns,
    new Array(columns.length).fill("VARCHAR")
  );

  const normalizedRows = dataRows.map((row) =>
    columns.map((_, index) => row[index] ?? null)
  );
  const totalRows = normalizedRows.length;
  if (totalRows === 0) {
    sendProgress(requestId, "importXlsx", "Ready", 100);
    return {
      tableName: payload.tableName,
      fileName: payload.fileName,
      rowCount: 0,
      columns: columns.map((name) => ({ name, type: "VARCHAR" })),
    };
  }

  sendProgress(requestId, "importXlsx", "Inserting rows", 50);
  await insertXlsxRows(
    conn,
    payload.tableName,
    columns,
    normalizedRows,
    (current, total) => {
      const percent = 50 + Math.round((current / total) * 40);
      sendProgress(
        requestId,
        "importXlsx",
        `Inserting rows (${current}/${total})`,
        percent
      );
    }
  );
  if (payload.inferTypes) {
    const inferred = await inferTypesFromSample(
      conn,
      payload.tableName,
      100,
      requestId,
      "importXlsx"
    );
    sendProgress(requestId, "importXlsx", "Creating typed table", 92);
    await replaceWithTypedTable(
      conn,
      payload.tableName,
      inferred.columns,
      inferred.columnTypes
    );
  }
  sendProgress(requestId, "importXlsx", "Finalizing", 95);
  sendProgress(requestId, "importXlsx", "Ready", 100);
  return {
    tableName: payload.tableName,
    fileName: payload.fileName,
    rowCount: totalRows,
    columns: columns.map((name) => ({ name, type: "VARCHAR" })),
  };
}

async function inferTypesFromSample(
  conn: duckdb.AsyncDuckDBConnection,
  tableName: string,
  sampleRows: number,
  requestId?: string,
  progressType?: WorkerMessageType
) {
  if (requestId && progressType) {
    sendProgress(requestId, progressType, "Sampling rows", 20);
  }
  const result = await conn.query(
    `SELECT * FROM ${quoteIdent(tableName)} LIMIT ${sampleRows}`
  );
  const rawRows = result.toArray();
  const rows = rawRows.map((row) =>
    typeof row?.toJSON === "function" ? row.toJSON() : row
  );
  const columns = result.schema.fields.map((field) => field.name);
  if (requestId && progressType) {
    sendProgress(requestId, progressType, "Deciding types", 60);
  }
  const columnTypes = inferColumnTypes(rows, columns);
  return { columns, columnTypes };
}

async function replaceWithTypedTable(
  conn: duckdb.AsyncDuckDBConnection,
  tableName: string,
  columns: string[],
  columnTypes: string[]
) {
  const selectColumns = columns
    .map((column, index) => {
      const type = columnTypes[index] ?? "VARCHAR";
      if (type === "VARCHAR") {
        return quoteIdent(column);
      }
      if (type === "TIMESTAMP") {
        return `${buildEpochAwareTimestampExpr(column)} AS ${quoteIdent(column)}`;
      }
      if (type === "DATE") {
        return `TRY_CAST(${buildEpochAwareTimestampExpr(column)} AS DATE) AS ${quoteIdent(column)}`;
      }
      return `TRY_CAST(${quoteIdent(column)} AS ${type}) AS ${quoteIdent(
        column
      )}`;
    })
    .join(", ");
  const tempTable = `${tableName}_typed_${Date.now()}`;
  const escaped = tableName.replace(/'/g, "''");
  const safeDrop = async (sql: string) => {
    try {
      await conn.query(sql);
    } catch (err) {
      const message = String((err as Error)?.message || err);
      const isMissing = /does not exist/i.test(message);
      const isTypeMismatch = /type Table|type View/i.test(message);
      if (!isMissing && !isTypeMismatch) {
        throw err;
      }
    }
  };

  const dropExisting = async () => {
    try {
      const info = await conn.query(
        `SELECT table_type FROM information_schema.tables WHERE table_schema='main' AND table_name='${escaped}'`
      );
      const row = info.toArray()[0] as { table_type?: string } | undefined;
      const tableType = row?.table_type?.toUpperCase();
      if (tableType === "VIEW") {
        await safeDrop(`DROP VIEW IF EXISTS ${quoteIdent(tableName)}`);
        return;
      }
      if (tableType) {
        await safeDrop(`DROP TABLE IF EXISTS ${quoteIdent(tableName)}`);
        return;
      }
    } catch {
      // Ignore metadata lookup failures.
    }
    await safeDrop(`DROP TABLE IF EXISTS ${quoteIdent(tableName)}`);
    await safeDrop(`DROP VIEW IF EXISTS ${quoteIdent(tableName)}`);
  };

  await conn.query("BEGIN TRANSACTION");
  try {
    await conn.query(
      `CREATE TABLE ${quoteIdent(tempTable)} AS SELECT ${selectColumns} FROM ${quoteIdent(
        tableName
      )}`
    );
    await dropExisting();
    await conn.query(
      `ALTER TABLE ${quoteIdent(tempTable)} RENAME TO ${quoteIdent(tableName)}`
    );
    await conn.query("COMMIT");
  } catch (err) {
    await conn.query("ROLLBACK");
    throw err;
  }
}

async function query(payload: QueryPayload): Promise<QueryResult> {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  const start = performance.now();
  const result = await conn.query(payload.sql);
  const elapsedMs = performance.now() - start;
  const rawRows = result.toArray();
  const rows = rawRows.map((row) =>
    typeof row?.toJSON === "function" ? row.toJSON() : row
  );
  const columns = result.schema.fields.map((field) => field.name);
  return { columns, rows, rowCount: rows.length, elapsedMs };
}

async function countRows(payload: QueryPayload): Promise<number> {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  const result = await conn.query(
    `SELECT COUNT(*) as count FROM (${payload.sql}) AS fs_count`
  );
  const rows = result.toArray();
  return Number(rows[0]?.count ?? 0);
}

async function exportQuery(payload: ExportQueryPayload): Promise<ExportResult> {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  const dbInstance = assertDb();
  const exportFile = `${crypto.randomUUID()}-${payload.fileName}.${payload.format}`;
  await conn.query(
    `COPY (${payload.sql}) TO '${exportFile}' (FORMAT 'csv', HEADER true)`
  );
  const buffer = await dbInstance.copyFileToBuffer(exportFile);
  await dbInstance.dropFile(exportFile);
  return {
    buffer: buffer.buffer as ArrayBuffer,
    byteOffset: buffer.byteOffset,
    byteLength: buffer.byteLength,
  };
}

async function tableCount(payload: WorkspacePayload): Promise<number> {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  const schema = schemaName(payload.workspaceId);
  const result = await conn.query(
    `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = '${schema}'`
  );
  const rows = result.toArray();
  return Number(rows[0]?.count ?? 0);
}

async function listTables(payload: WorkspacePayload): Promise<string[]> {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  const schema = schemaName(payload.workspaceId);
  const result = await conn.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema}' ORDER BY table_name`
  );
  return result.toArray().map((row) => String(row.table_name));
}

async function listColumns(payload: TableNamePayload) {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  const schema = schemaName(payload.workspaceId);
  const result = await conn.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name = '${payload.tableName.replace(/'/g, "''")}' ORDER BY ordinal_position`
  );
  return result.toArray().map((row) => ({
    name: String(row.column_name),
    type: String(row.data_type),
  }));
}

async function renameTable(payload: RenameTablePayload) {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  await conn.query(
    `ALTER TABLE ${quoteIdent(payload.currentName)} RENAME TO ${quoteIdent(
      payload.nextName
    )}`
  );
}

async function copyTable(payload: CopyTablePayload) {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  await conn.query(
    `CREATE TABLE ${quoteIdent(payload.nextName)} AS SELECT * FROM ${quoteIdent(
      payload.sourceName
    )}`
  );
}

async function dropTable(payload: TableNamePayload) {
  await initializeDb();
  const conn = await getConnection(payload.workspaceId);
  const tableName = payload.tableName;
  const escaped = tableName.replace(/'/g, "''");

  const safeDrop = async (sql: string) => {
    try {
      await conn.query(sql);
    } catch (err) {
      const message = String((err as Error)?.message || err);
      const isMissing = /does not exist/i.test(message);
      const isTypeMismatch = /type Table|type View/i.test(message);
      if (!isMissing && !isTypeMismatch) {
        throw err;
      }
    }
  };

  try {
    const info = await conn.query(
      `SELECT table_type FROM information_schema.tables WHERE table_schema='main' AND table_name='${escaped}'`
    );
    const row = info.toArray()[0] as { table_type?: string } | undefined;
    const tableType = row?.table_type?.toUpperCase();
    if (tableType === "VIEW") {
      await safeDrop(`DROP VIEW IF EXISTS ${quoteIdent(tableName)}`);
      return;
    }
    if (tableType) {
      await safeDrop(`DROP TABLE IF EXISTS ${quoteIdent(tableName)}`);
      return;
    }
  } catch {
    // Fall through to best-effort drops if metadata query fails.
  }

  await safeDrop(`DROP TABLE IF EXISTS ${quoteIdent(tableName)}`);
  await safeDrop(`DROP VIEW IF EXISTS ${quoteIdent(tableName)}`);
}

async function readCsvSample(buffer: ArrayBuffer) {
  const slice = buffer.slice(0, 64 * 1024);
  let text = "";
  try {
    text = new TextDecoder("utf-8").decode(slice);
  } catch {
    text = "";
  }
  const cleaned = text.replace(/\0/g, "");
  const lines = cleaned.split(/\r?\n/);
  const previewText = lines.slice(0, 2).join("\n").trim() || cleaned.slice(0, 200);
  const firstLine = (lines[0] ?? "").replace(/^\uFEFF/, "");
  return { previewText, firstLine };
}

async function readCsvSampleFromFile(file: File) {
  const slice = file.slice(0, 64 * 1024);
  const buffer = await slice.arrayBuffer();
  return readCsvSample(buffer);
}

function buildReadCsvSql(fileName: string, delimiter: string, header: boolean) {
  const delim = delimiter === "\t" ? "\t" : delimiter;
  const safeDelimiter = delim.replace(/'/g, "");
  return `SELECT * FROM read_csv('${fileName}', header=${
    header ? "true" : "false"
  }, delim='${safeDelimiter}', all_varchar=true, null_padding=true, ignore_errors=true, strict_mode=false)`;
}

function buildReadCsvAutoSql(
  fileName: string,
  delimiter: string,
  header: boolean
) {
  const delim = delimiter === "\t" ? "\t" : delimiter;
  const safeDelimiter = delim.replace(/'/g, "");
  return `SELECT * FROM read_csv_auto('${fileName}', header=${
    header ? "true" : "false"
  }, sample_size=20000, all_varchar=true, null_padding=true, ignore_errors=true, strict_mode=false, delim='${safeDelimiter}')`;
}

async function createCsvTable(
  conn: duckdb.AsyncDuckDBConnection,
  tableName: string,
  sql: string
) {
  await conn.query(
    `CREATE OR REPLACE TABLE ${quoteIdent(tableName)} AS ${sql}`
  );
  const rowCountResult = await conn.query(
    `SELECT COUNT(*) as count FROM ${quoteIdent(tableName)}`
  );
  const rowCountRows = rowCountResult.toArray();
  const rowCount = Number(rowCountRows[0]?.count ?? 0);
  const columnsResult = await conn.query(
    `PRAGMA table_info(${quoteIdent(tableName)})`
  );
  const columns = columnsResult.toArray().map((row) => ({
    name: String(row.name),
    type: String(row.type),
  }));
  return { rowCount, columns };
}

async function handleMessage(event: MessageEvent<WorkerRequest>) {
  const { id, type, payload } = event.data;
  try {
    switch (type) {
      case "init": {
        const p = payload as { baseUrl?: string } | undefined;
        BASE_URL = p?.baseUrl ?? BASE_URL;
        await initializeDb(id);
        sendResponse({ id, type, success: true, data: { ready: true } });
        return;
      }
      case "importCsvLegacy": {
        const result = await importCsvLegacy(id, payload as CsvImportPayload);
        sendResponse({ id, type, success: true, data: result });
        return;
      }
      case "importParquet":
      case "attachParquet": {
        const result = await importParquet(id, payload as ParquetImportPayload);
        sendResponse({ id, type, success: true, data: result });
        return;
      }
      case "importXlsx": {
        const result = await importXlsx(id, payload as XlsxImportPayload);
        sendResponse({ id, type, success: true, data: result });
        return;
      }
      case "inferCsvTypes": {
        const result = await inferCsvTypes(id, payload as CsvInferPayload);
        sendResponse({ id, type, success: true, data: result });
        return;
      }
      case "attachXlsx": {
        await attachXlsx(payload as XlsxAttachPayload);
        sendResponse({ id, type, success: true });
        return;
      }
      case "createXlsxTable": {
        await createXlsxTableForWorkspace(payload as XlsxCreatePayload);
        sendResponse({ id, type, success: true });
        return;
      }
      case "insertXlsxRows": {
        await insertXlsxRowsForWorkspace(payload as XlsxInsertPayload);
        sendResponse({ id, type, success: true });
        return;
      }
      case "xlsxPreview": {
        const result = await xlsxPreview(id, payload as XlsxPreviewPayload);
        sendResponse({ id, type, success: true, data: result });
        return;
      }
      case "parquetPreview": {
        const result = await parquetPreview(id, payload as ParquetPreviewPayload);
        sendResponse({ id, type, success: true, data: result });
        return;
      }
      case "query": {
        const result = await query(payload as QueryPayload);
        sendResponse({ id, type, success: true, data: result });
        return;
      }
      case "countRows": {
        const result = await countRows(payload as QueryPayload);
        sendResponse({ id, type, success: true, data: result });
        return;
      }
      case "exportQuery": {
        const result = await exportQuery(payload as ExportQueryPayload);
        sendResponse({ id, type, success: true, data: result }, [result.buffer]);
        return;
      }
      case "tableCount": {
        const result = await tableCount(payload as WorkspacePayload);
        sendResponse({ id, type, success: true, data: result });
        return;
      }
      case "listTables": {
        const result = await listTables(payload as WorkspacePayload);
        sendResponse({ id, type, success: true, data: result });
        return;
      }
      case "listColumns": {
        const result = await listColumns(payload as TableNamePayload);
        sendResponse({ id, type, success: true, data: result });
        return;
      }
      case "renameTable": {
        await renameTable(payload as RenameTablePayload);
        sendResponse({ id, type, success: true });
        return;
      }
      case "copyTable": {
        await copyTable(payload as CopyTablePayload);
        sendResponse({ id, type, success: true });
        return;
      }
      case "dropTable": {
        await dropTable(payload as TableNamePayload);
        sendResponse({ id, type, success: true });
        return;
      }
      default:
        sendResponse({
          id,
          type,
          success: false,
          error: `Unknown worker message type: ${type}`,
        });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Worker error";
    sendResponse({ id, type, success: false, error: message });
  }
}

ctx.onmessage = (event) => {
  void handleMessage(event);
};
