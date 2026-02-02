import type { CsvImportOptions } from "@/src/duckdb/csv";
import type { XlsxCell } from "@/src/lib/xlsxTable";

export type WorkerMessageType =
  | "init"
  | "importCsvLegacy"
  | "importParquet"
  | "attachParquet"
  | "importXlsx"
  | "inferCsvTypes"
  | "attachXlsx"
  | "createXlsxTable"
  | "insertXlsxRows"
  | "xlsxPreview"
  | "parquetPreview"
  | "query"
  | "countRows"
  | "exportQuery"
  | "tableCount"
  | "listTables"
  | "listColumns"
  | "renameTable"
  | "copyTable"
  | "dropTable";

export type WorkerRequest<TPayload = unknown> = {
  id: string;
  type: WorkerMessageType;
  payload?: TPayload;
};

export type WorkerResponse<TData = unknown> = {
  id: string;
  type: WorkerMessageType;
  success: boolean;
  data?: TData;
  error?: string;
  progress?: WorkerProgress;
};

export type WorkerProgress = {
  stage: string;
  percent?: number;
};

export type QueryResult = {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  elapsedMs: number;
};

export type AttachedTable = {
  tableName: string;
  fileName: string;
  rowCount?: number;
  columns?: { name: string; type: string }[];
  csvDelimiter?: string;
  csvHeader?: boolean;
};

export type CsvImportPayload = {
  workspaceId: string;
  fileName: string;
  tableName: string;
  buffer?: ArrayBuffer;
  file?: File;
  options?: CsvImportOptions;
};

export type ParquetImportPayload = {
  workspaceId: string;
  fileName: string;
  tableName: string;
  buffer?: ArrayBuffer;
  file?: File;
};

export type ParquetPreviewPayload = {
  workspaceId: string;
  fileName: string;
  buffer: ArrayBuffer;
  previewRows: number;
};

export type ParquetPreviewResult = {
  columns: string[];
  rows: Record<string, unknown>[];
};

export type XlsxImportPayload = {
  workspaceId: string;
  fileName: string;
  tableName: string;
  buffer: ArrayBuffer;
  sheetName: string;
  header: boolean;
  range?: { startRow: number; endRow: number } | null;
  inferTypes: boolean;
};

export type CsvInferPayload = {
  workspaceId: string;
  tableName: string;
  fileName?: string;
  sampleSize?: number;
  options?: {
    delimiter?: CsvImportOptions["delimiter"] | null;
    header?: boolean;
  };
};

export type CsvInferResult = {
  delimiter: string;
};

export type XlsxAttachPayload = {
  workspaceId: string;
  tableName: string;
  columns: string[];
  rows: XlsxCell[][];
  columnTypes?: string[];
};

export type XlsxCreatePayload = {
  workspaceId: string;
  tableName: string;
  columns: string[];
  columnTypes?: string[];
};

export type XlsxInsertPayload = {
  workspaceId: string;
  tableName: string;
  columns: string[];
  rows: XlsxCell[][];
};

export type XlsxPreviewPayload = {
  workspaceId: string;
  fileName: string;
  buffer: ArrayBuffer;
  sheetName: string;
  header: boolean;
  range?: { startRow: number; endRow: number } | null;
  previewRows: number;
};

export type XlsxPreviewResult = {
  columns: string[];
  rows: (string | number | null)[][];
};

export type WorkspacePayload = {
  workspaceId: string;
};

export type QueryPayload = {
  workspaceId: string;
  sql: string;
};

export type ExportQueryPayload = {
  workspaceId: string;
  sql: string;
  format: "csv";
  fileName: string;
};

export type TableNamePayload = {
  workspaceId: string;
  tableName: string;
};

export type RenameTablePayload = {
  workspaceId: string;
  currentName: string;
  nextName: string;
};

export type CopyTablePayload = {
  workspaceId: string;
  sourceName: string;
  nextName: string;
};

export type ExportResult = {
  buffer: ArrayBuffer;
  byteOffset: number;
  byteLength: number;
};
