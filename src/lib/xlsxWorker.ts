import type { XlsxCell } from "@/src/lib/xlsxTable";

type PreviewResult = {
  sheetNames: string[];
  previews: Record<string, XlsxCell[][]>;
  usedRanges: Record<string, { rows: number; cols: number }>;
};

type RangeResult = {
  rows: XlsxCell[][];
};

type SheetScanResult = {
  rows: XlsxCell[][];
};

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  onProgress?: (payload: XlsxProgressPayload) => void;
  onChunk?: (rows: XlsxCell[][]) => void;
};

export type XlsxProgressPayload = {
  stage: "read" | "sample" | "stream";
  current: number;
  total: number;
  sheetName?: string;
};

let worker: Worker | null = null;
const pending = new Map<string, PendingRequest>();

function getWorker() {
  if (worker) {
    return worker;
  }
  worker = new Worker(new URL("../workers/xlsxParser.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.onmessage = (event: MessageEvent) => {
    const message = event.data as
      | {
          id: string;
          ok: boolean;
          payload?: PreviewResult | RangeResult | SheetScanResult;
          error?: string;
        }
      | {
          id: string;
          kind: "progress" | "chunk" | "done" | "error";
          payload?: XlsxProgressPayload | { rows: XlsxCell[][] } | { message?: string };
        };
    if (!message || typeof message !== "object") {
      return;
    }
    const id = "id" in message ? message.id : null;
    if (!id) {
      return;
    }
    const entry = pending.get(id);
    if (!entry) {
      return;
    }
    if ("kind" in message) {
      if (message.kind === "progress") {
        entry.onProgress?.(message.payload as XlsxProgressPayload);
        return;
      }
      if (message.kind === "chunk") {
        const payload = message.payload as { rows: XlsxCell[][] } | undefined;
        if (payload?.rows) {
          entry.onChunk?.(payload.rows);
        }
        return;
      }
      if (message.kind === "done") {
        pending.delete(id);
        entry.resolve(undefined);
        return;
      }
      if (message.kind === "error") {
        pending.delete(id);
        const payload = message.payload as { message?: string } | undefined;
        entry.reject(new Error(payload?.message ?? "XLSX parse failed."));
        return;
      }
    } else {
      pending.delete(id);
      const { ok, payload, error } = message;
      if (ok) {
        entry.resolve(payload as PreviewResult | RangeResult | SheetScanResult);
      } else {
        entry.reject(new Error(error ?? "XLSX parse failed."));
      }
    }
  };
  return worker;
}

function requestXlsx<T extends PreviewResult | RangeResult | SheetScanResult>(
  message: Record<string, unknown>,
  options?: {
    onProgress?: (payload: XlsxProgressPayload) => void;
    onChunk?: (rows: XlsxCell[][]) => void;
  }
) {
  const requestId = crypto.randomUUID();
  const instance = getWorker();
  return new Promise<T>((resolve, reject) => {
    pending.set(requestId, {
      resolve: resolve as (value: unknown) => void,
      reject,
      onProgress: options?.onProgress,
      onChunk: options?.onChunk,
    });
    instance.postMessage({ id: requestId, ...message });
  });
}

export function requestXlsxPreview(
  buffer: ArrayBuffer,
  previewRows: number,
  previewCols: number
) {
  return requestXlsx<PreviewResult>({
    mode: "preview",
    buffer,
    previewRows,
    previewCols,
  });
}

export function requestXlsxSheetScan(
  buffer: ArrayBuffer,
  sheetName: string,
  scanRows: number,
  scanCols: number
) {
  return requestXlsx<SheetScanResult>({
    mode: "sheet",
    buffer,
    sheetName,
    scanRows,
    scanCols,
  });
}

export function requestXlsxRange(
  buffer: ArrayBuffer,
  sheetName: string,
  range: string
) {
  return requestXlsx<RangeResult>({ mode: "range", buffer, sheetName, range });
}

export function requestXlsxRangeStream(
  buffer: ArrayBuffer,
  sheetName: string,
  range: string,
  batchSize: number,
  onChunk: (rows: XlsxCell[][]) => void,
  onProgress?: (payload: XlsxProgressPayload) => void
) {
  const requestId = crypto.randomUUID();
  const instance = getWorker();
  const promise = new Promise<void>((resolve, reject) => {
    pending.set(requestId, {
      resolve: resolve as (value: unknown) => void,
      reject,
      onProgress,
      onChunk,
    });
    instance.postMessage({
      id: requestId,
      mode: "stream",
      buffer,
      sheetName,
      range,
      batchSize,
    });
  });

  const cancel = () => {
    const entry = pending.get(requestId);
    if (entry) {
      pending.delete(requestId);
      entry.reject(new Error("XLSX import cancelled."));
    }
    if (worker) {
      worker.terminate();
      worker = null;
    }
  };

  return { promise, cancel };
}
