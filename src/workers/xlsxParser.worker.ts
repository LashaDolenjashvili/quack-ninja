/// <reference lib="webworker" />

import * as XLSX from "xlsx";
import { type XlsxCell } from "@/src/lib/xlsxTable";

type PreviewPayload = {
  sheetNames: string[];
  previews: Record<string, XlsxCell[][]>;
  usedRanges: Record<string, { rows: number; cols: number }>;
};

type SheetScanPayload = {
  rows: XlsxCell[][];
};

type RequestMessage =
  | { id: string; buffer: ArrayBuffer; mode: "preview"; previewRows: number; previewCols: number }
  | {
      id: string;
      buffer: ArrayBuffer;
      mode: "sheet";
      sheetName: string;
      scanRows: number;
      scanCols: number;
    }
  | {
      id: string;
      buffer: ArrayBuffer;
      mode: "range";
      sheetName: string;
      range: string;
    };
type StreamMessage = {
  id: string;
  buffer: ArrayBuffer;
  mode: "stream";
  sheetName: string;
  range: string;
  batchSize: number;
};

type ExtendedRequestMessage = RequestMessage | StreamMessage;

type RangePayload = {
  rows: XlsxCell[][];
};

type ResponseMessage =
  | {
      id: string;
      ok: true;
      payload: PreviewPayload | SheetScanPayload | RangePayload;
    }
  | { id: string; ok: false; error: string }
  | { id: string; kind: "progress"; payload: { stage: "read" | "sample" | "stream"; current: number; total: number; sheetName?: string } }
  | { id: string; kind: "chunk"; payload: { rows: XlsxCell[][] } }
  | { id: string; kind: "done" }
  | { id: string; kind: "error"; payload: { message: string } };

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<ExtendedRequestMessage>) => {
  const { id, buffer, mode } = event.data;
  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    if (mode === "preview") {
      const previews: Record<string, XlsxCell[][]> = {};
      const usedRanges: Record<string, { rows: number; cols: number }> = {};
      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        if (!sheet) {
          continue;
        }
        const ref = sheet["!ref"];
        if (ref) {
          const decoded = XLSX.utils.decode_range(ref);
          usedRanges[name] = {
            rows: decoded.e.r - decoded.s.r + 1,
            cols: decoded.e.c - decoded.s.c + 1,
          };
        }
        previews[name] = [];
      }
      const payload: PreviewPayload = {
        sheetNames: workbook.SheetNames,
        previews,
        usedRanges,
      };
      ctx.postMessage({ id, ok: true, payload } satisfies ResponseMessage);
      return;
    }
    if (mode === "sheet") {
      const sheet = workbook.Sheets[event.data.sheetName];
      if (!sheet) {
        throw new Error("Sheet not found.");
      }
      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: true,
        defval: null,
        range: {
          s: { r: 0, c: 0 },
          e: { r: Math.max(0, event.data.scanRows - 1), c: Math.max(0, event.data.scanCols - 1) },
        },
      }) as XlsxCell[][];
      const payload = { rows };
      ctx.postMessage({ id, ok: true, payload } satisfies ResponseMessage);
      return;
    }
    if (mode === "stream") {
      const sheet = workbook.Sheets[event.data.sheetName];
      if (!sheet) {
        throw new Error("Sheet not found.");
      }
      ctx.postMessage({
        id,
        kind: "progress",
        payload: { stage: "read", current: 0, total: 1, sheetName: event.data.sheetName },
      } satisfies ResponseMessage);
      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: true,
        defval: null,
        range: event.data.range,
      }) as XlsxCell[][];
      const totalRows = rows.length;
      const batchSize = Math.max(1, event.data.batchSize);
      ctx.postMessage({
        id,
        kind: "progress",
        payload: { stage: "stream", current: 0, total: totalRows, sheetName: event.data.sheetName },
      } satisfies ResponseMessage);
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        ctx.postMessage({ id, kind: "chunk", payload: { rows: batch } } satisfies ResponseMessage);
        ctx.postMessage({
          id,
          kind: "progress",
          payload: {
            stage: "stream",
            current: Math.min(i + batch.length, totalRows),
            total: totalRows,
            sheetName: event.data.sheetName,
          },
        } satisfies ResponseMessage);
      }
      ctx.postMessage({ id, kind: "done" } satisfies ResponseMessage);
      return;
    }
    const sheet = workbook.Sheets[event.data.sheetName];
    if (!sheet) {
      throw new Error("Sheet not found.");
    }
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: null,
      range: event.data.range,
    }) as XlsxCell[][];
    const payload: RangePayload = { rows };
    ctx.postMessage({ id, ok: true, payload } satisfies ResponseMessage);
  } catch (err) {
    const message = err instanceof Error ? err.message : "XLSX parse failed.";
    if (mode === "stream") {
      ctx.postMessage({
        id,
        kind: "error",
        payload: { message },
      } satisfies ResponseMessage);
      return;
    }
    ctx.postMessage({ id, ok: false, error: message } satisfies ResponseMessage);
  }
};
