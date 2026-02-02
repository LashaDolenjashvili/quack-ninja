import type {
  AttachedTable,
  CopyTablePayload,
  CsvImportPayload,
  CsvInferPayload,
  CsvInferResult,
  ExportQueryPayload,
  ExportResult,
  ParquetImportPayload,
  XlsxImportPayload,
  QueryPayload,
  QueryResult,
  RenameTablePayload,
  TableNamePayload,
  WorkerMessageType,
  WorkerProgress,
  WorkerRequest,
  WorkerResponse,
  WorkspacePayload,
  XlsxAttachPayload,
  XlsxCreatePayload,
  XlsxInsertPayload,
  XlsxPreviewPayload,
  XlsxPreviewResult,
  ParquetPreviewPayload,
  ParquetPreviewResult,
} from "@/src/lib/duckdb-worker-types";
import type { CsvImportOptions, CsvDelimiter } from "@/src/duckdb/csv";
import { logClientError } from "@/src/lib/logger";
import type { XlsxCell } from "@/src/lib/xlsxTable";

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: WorkerProgress) => void;
};

export class DuckDBClient {
  private static readonly STREAMING_FILE_THRESHOLD = 256 * 1024 * 1024;
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private requestIdCounter = 0;
  private initializing: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initializing) {
      return this.initializing;
    }
    this.ensureWorker();
    this.initializing = this.sendRequest("init").catch((err) => {
      this.initializing = null;
      logClientError(err, "DuckDB init failed");
      throw err;
    }) as Promise<void>;
    this.sendRequest("init", { baseUrl: window.location.origin });
    await this.initializing;
  }

  async attachCsv(
    workspaceId: string,
    file: File,
    tableName: string,
    options: CsvImportOptions,
    handle?: FileSystemFileHandle | null
  ): Promise<AttachedTable> {
    return this.importCsvLegacy(workspaceId, file, tableName, options, handle);
  }

  async importCsvLegacy(
    workspaceId: string,
    file: File,
    tableName: string,
    options?: CsvImportOptions,
    _handle?: FileSystemFileHandle | null,
    onProgress?: (progress: WorkerProgress) => void
  ): Promise<AttachedTable> {
    await this.init();
    if (file.size === 0) {
      throw new Error("CSV file is empty.");
    }
    const useStreamingHandle =
      file.size >= DuckDBClient.STREAMING_FILE_THRESHOLD;
    const buffer = useStreamingHandle ? undefined : await file.arrayBuffer();
    if (!useStreamingHandle && (!buffer || buffer.byteLength === 0)) {
      throw new Error("CSV bytes are empty in worker import.");
    }
    const payload: CsvImportPayload = {
      workspaceId,
      fileName: file.name,
      tableName,
      buffer,
      file: useStreamingHandle ? file : undefined,
      options,
    };
    return this.sendRequest<AttachedTable>(
      "importCsvLegacy",
      payload,
      onProgress,
      buffer ? [buffer] : undefined
    );
  }

  async attachParquet(
    workspaceId: string,
    file: File,
    tableName: string,
    onProgress?: (progress: WorkerProgress) => void
  ): Promise<AttachedTable> {
    return this.importParquet(workspaceId, file, tableName, onProgress);
  }

  async importParquet(
    workspaceId: string,
    file: File,
    tableName: string,
    onProgress?: (progress: WorkerProgress) => void
  ): Promise<AttachedTable> {
    await this.init();
    if (file.size === 0) {
      throw new Error("Parquet file is empty.");
    }
    const useStreamingHandle =
      file.size >= DuckDBClient.STREAMING_FILE_THRESHOLD;
    const buffer = useStreamingHandle ? undefined : await file.arrayBuffer();
    if (!useStreamingHandle && (!buffer || buffer.byteLength === 0)) {
      throw new Error("Parquet bytes are empty in worker import.");
    }
    const payload: ParquetImportPayload = {
      workspaceId,
      fileName: file.name,
      tableName,
      buffer,
      file: useStreamingHandle ? file : undefined,
    };
    return this.sendRequest<AttachedTable>(
      "importParquet",
      payload,
      onProgress,
      buffer ? [buffer] : undefined
    );
  }

  async importXlsx(
    workspaceId: string,
    file: File,
    tableName: string,
    options: {
      sheetName: string;
      header: boolean;
      range?: { startRow: number; endRow: number } | null;
      inferTypes: boolean;
    },
    onProgress?: (progress: WorkerProgress) => void
  ): Promise<AttachedTable> {
    await this.init();
    const buffer = await file.arrayBuffer();
    if (buffer.byteLength === 0) {
      throw new Error("Excel file is empty.");
    }
    const payload: XlsxImportPayload = {
      workspaceId,
      fileName: file.name,
      tableName,
      buffer,
      sheetName: options.sheetName,
      header: options.header,
      range: options.range ?? null,
      inferTypes: options.inferTypes,
    };
    return this.sendRequest<AttachedTable>(
      "importXlsx",
      payload,
      onProgress,
      [buffer]
    );
  }

  async inferCsvTypes(
    workspaceId: string,
    tableName: string,
    options?: {
      delimiter?: CsvDelimiter | null;
      header?: boolean;
    },
    onProgress?: (progress: WorkerProgress) => void
  ): Promise<CsvInferResult> {
    await this.init();
    const payload: CsvInferPayload = {
      workspaceId,
      tableName,
      options,
    };
    return this.sendRequest<CsvInferResult>(
      "inferCsvTypes",
      payload,
      onProgress
    );
  }

  async attachXlsx(
    workspaceId: string,
    tableName: string,
    columns: string[],
    rows: XlsxCell[][],
    columnTypes?: string[]
  ): Promise<void> {
    await this.init();
    const payload: XlsxAttachPayload = {
      workspaceId,
      tableName,
      columns,
      rows,
      columnTypes,
    };
    await this.sendRequest("attachXlsx", payload);
  }

  async createXlsxTableForWorkspace(
    workspaceId: string,
    tableName: string,
    columns: string[],
    columnTypes?: string[]
  ) {
    await this.init();
    const payload: XlsxCreatePayload = {
      workspaceId,
      tableName,
      columns,
      columnTypes,
    };
    await this.sendRequest("createXlsxTable", payload);
  }

  async insertXlsxRowsForWorkspace(
    workspaceId: string,
    tableName: string,
    columns: string[],
    rows: XlsxCell[][]
  ) {
    await this.init();
    const payload: XlsxInsertPayload = {
      workspaceId,
      tableName,
      columns,
      rows,
    };
    await this.sendRequest("insertXlsxRows", payload);
  }

  async xlsxPreview(
    workspaceId: string,
    file: File,
    sheetName: string,
    header: boolean,
    range: { startRow: number; endRow: number } | null,
    previewRows: number,
    onProgress?: (progress: WorkerProgress) => void
  ): Promise<XlsxPreviewResult> {
    await this.init();
    const buffer = await file.arrayBuffer();
    if (buffer.byteLength === 0) {
      throw new Error("Excel file is empty.");
    }
    const payload: XlsxPreviewPayload = {
      workspaceId,
      fileName: file.name,
      buffer,
      sheetName,
      header,
      range,
      previewRows,
    };
    return this.sendRequest<XlsxPreviewResult>(
      "xlsxPreview",
      payload,
      onProgress,
      [buffer]
    );
  }

  async parquetPreview(
    workspaceId: string,
    file: File,
    previewRows = 50
  ): Promise<ParquetPreviewResult> {
    await this.init();
    const buffer = await file.arrayBuffer();
    if (buffer.byteLength === 0) {
      throw new Error("Parquet bytes are empty.");
    }
    const payload: ParquetPreviewPayload = {
      workspaceId,
      fileName: file.name,
      buffer,
      previewRows,
    };
    return this.sendRequest<ParquetPreviewResult>(
      "parquetPreview",
      payload,
      undefined,
      [buffer]
    );
  }

  async query(workspaceId: string, sql: string): Promise<QueryResult> {
    await this.init();
    const payload: QueryPayload = { workspaceId, sql };
    return this.sendRequest<QueryResult>("query", payload);
  }

  async countRows(workspaceId: string, sql: string): Promise<number> {
    await this.init();
    const payload: QueryPayload = { workspaceId, sql };
    return this.sendRequest<number>("countRows", payload);
  }

  async exportQuery(
    workspaceId: string,
    sql: string,
    format: "csv",
    fileName: string
  ): Promise<Uint8Array> {
    await this.init();
    const payload: ExportQueryPayload = { workspaceId, sql, format, fileName };
    const result = await this.sendRequest<ExportResult>("exportQuery", payload);
    return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
  }

  async tableCount(workspaceId: string): Promise<number> {
    await this.init();
    const payload: WorkspacePayload = { workspaceId };
    return this.sendRequest<number>("tableCount", payload);
  }

  async listTables(workspaceId: string): Promise<string[]> {
    await this.init();
    const payload: WorkspacePayload = { workspaceId };
    return this.sendRequest<string[]>("listTables", payload);
  }

  async listColumns(
    workspaceId: string,
    tableName: string
  ): Promise<{ name: string; type: string }[]> {
    await this.init();
    const payload: TableNamePayload = { workspaceId, tableName };
    return this.sendRequest<{ name: string; type: string }[]>(
      "listColumns",
      payload
    );
  }

  async renameTable(
    workspaceId: string,
    currentName: string,
    nextName: string
  ): Promise<void> {
    await this.init();
    const payload: RenameTablePayload = { workspaceId, currentName, nextName };
    await this.sendRequest("renameTable", payload);
  }

  async copyTable(
    workspaceId: string,
    sourceName: string,
    nextName: string
  ): Promise<void> {
    await this.init();
    const payload: CopyTablePayload = { workspaceId, sourceName, nextName };
    await this.sendRequest("copyTable", payload);
  }

  async dropTable(workspaceId: string, tableName: string): Promise<void> {
    await this.init();
    const payload: TableNamePayload = { workspaceId, tableName };
    await this.sendRequest("dropTable", payload);
  }

  private ensureWorker() {
    if (this.worker) {
      return;
    }
    this.worker = new Worker(
      new URL("../workers/duckdb.worker.ts", import.meta.url),
      { type: "module" }
    );
    this.worker.onmessage = this.handleMessage;
  }

  private generateId(): string {
    return `req_${++this.requestIdCounter}_${Date.now()}`;
  }

  private handleMessage = (event: MessageEvent<WorkerResponse>) => {
    const { id, success, data, error, progress } = event.data;
    const pending = this.pendingRequests.get(id);
    if (!pending) {
      return;
    }

    if (progress) {
      pending.onProgress?.(progress);
      return;
    }

    this.pendingRequests.delete(id);
    if (success) {
      pending.resolve(data);
    } else {
      pending.reject(new Error(error || "Unknown error"));
    }
  };

  private sendRequest<T>(
    type: WorkerMessageType,
    payload?: unknown,
    onProgress?: (progress: WorkerProgress) => void,
    transfer?: Transferable[]
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("DuckDB worker not initialized."));
        return;
      }
      const id = this.generateId();
      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        onProgress,
      });
      try {
        this.worker.postMessage({ id, type, payload } satisfies WorkerRequest, transfer ?? []);
      } catch (err) {
        this.pendingRequests.delete(id);
        reject(err instanceof Error ? err : new Error("Worker request failed."));
      }
    });
  }
}
