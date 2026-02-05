"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Banner } from "@/src/components/ui/banner";
import { Button } from "@/src/components/ui/button";
import {
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@/src/components/ui/modal";
import {
  buildPreviewRows,
  preflightCsv,
  type CsvPreflight,
} from "@/src/lib/csvPreflight";
import { normalizeTableName } from "@/src/lib/tableName";
import { requestXlsxPreview } from "@/src/lib/xlsxWorker";
import { getDuckDBClient } from "@/src/duckdb/duckdbSingleton";
import { type CsvDelimiter } from "@/src/duckdb/csv";
import type { WorkerProgress } from "@/src/lib/duckdb-worker-types";

type CsvImportModalProps = {
  open: boolean;
  onClose: () => void;
  workspaceId?: string;
  sessionUsageBytes?: number;
  sessionCapBytes?: number;
  importing?: boolean;
  progress?: WorkerProgress | null;
  allowParquet?: boolean;
  allowExcel?: boolean;
  onImport: (payload: {
    file: File;
    handle?: FileSystemFileHandle | null;
    tableName: string;
    delimiter: CsvDelimiter;
    header: boolean;
    autoInfer: boolean;
    fileType: "csv" | "parquet" | "xlsx";
    sheetName?: string;
    sheetRange?: { startRow: number; endRow: number } | null;
  }) => Promise<boolean>;
};

const DELIMITER_OPTIONS: { label: string; value: CsvDelimiter }[] = [
  { label: "Auto", value: "auto" },
  { label: "Comma (,)", value: "," },
  { label: "Semicolon (;)", value: ";" },
  { label: "Tab (\\t)", value: "\t" },
  { label: "Pipe (|)", value: "|" },
];

export function CsvImportModal({
  open,
  onClose,
  workspaceId = "console",
  sessionUsageBytes,
  sessionCapBytes,
  onImport,
  importing = false,
  progress = null,
  allowParquet = false,
  allowExcel = false,
}: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(
    null
  );
  const [preflight, setPreflight] = useState<CsvPreflight | null>(null);
  const [delimiter, setDelimiter] = useState<CsvDelimiter>("auto");
  const [header, setHeader] = useState(true);
  const [autoInfer, setAutoInfer] = useState(true);
  const [fileType, setFileType] = useState<"csv" | "parquet" | "xlsx">("csv");
  const [tableName, setTableName] = useState("");
  const [xlsxSheets, setXlsxSheets] = useState<string[]>([]);
  const [xlsxSheet, setXlsxSheet] = useState<string>("");
  const [xlsxPreviewLoading, setXlsxPreviewLoading] = useState(false);
  const [xlsxPreviewColumns, setXlsxPreviewColumns] = useState<string[]>([]);
  const [xlsxPreviewRows, setXlsxPreviewRows] = useState<(string | number | null)[][]>(
    []
  );
  const [xlsxPreviewProgress, setXlsxPreviewProgress] =
    useState<WorkerProgress | null>(null);
  const [xlsxRange, setXlsxRange] = useState<{ rows: number; cols: number } | null>(
    null
  );
  const [xlsxRangeEnabled, setXlsxRangeEnabled] = useState(false);
  const [xlsxRangeStart, setXlsxRangeStart] = useState("1");
  const [xlsxRangeEnd, setXlsxRangeEnd] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [parquetPreviewLoading, setParquetPreviewLoading] = useState(false);
  const [parquetPreviewColumns, setParquetPreviewColumns] = useState<string[]>([]);
  const [parquetPreviewRows, setParquetPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const xlsxInferenceTooLarge =
    fileType === "xlsx" &&
    ((file?.size ?? 0) > 200 * 1024 * 1024 ||
      (xlsxRange?.rows ?? 0) > 200_000);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isBusy = submitting || importing;
  const progressStage = progress?.stage ?? "Importing";
  const progressPercent =
    progress?.percent !== undefined
      ? `${Math.round(progress.percent)}%`
      : null;
  const sessionUsageRatio =
    sessionUsageBytes !== undefined && sessionCapBytes
      ? sessionUsageBytes / sessionCapBytes
      : null;
  const supportedLabels = [
    "CSV",
    allowParquet ? "Parquet" : null,
    allowExcel ? "Excel" : null,
  ].filter((item): item is string => Boolean(item));
  const supportedLabel = supportedLabels.join(", ");
  const supportedDescription =
    supportedLabels.length === 1
      ? `${supportedLabels[0]} files`
      : supportedLabels.length === 2
        ? `${supportedLabels[0]} or ${supportedLabels[1]} files`
        : `${supportedLabels.slice(0, -1).join(", ")}, or ${supportedLabels.at(-1)} files`;
  const fileTypeLabel = file
    ? fileType === "csv"
      ? "CSV"
      : fileType === "parquet"
        ? "Parquet"
        : "Excel"
    : "—";
  const normalizedRange = useMemo(() => {
    if (!xlsxRangeEnabled) {
      return null;
    }
    const start = Number.parseInt(xlsxRangeStart, 10);
    const end = Number.parseInt(xlsxRangeEnd, 10);
    if (!Number.isFinite(start) || start < 1 || !Number.isFinite(end) || end < 1) {
      return null;
    }
    if (end < start) {
      return null;
    }
    return { startRow: start, endRow: end };
  }, [xlsxRangeEnd, xlsxRangeEnabled, xlsxRangeStart]);
  const xlsxRangeInvalid =
    xlsxRangeEnabled &&
    (!xlsxRangeStart || !xlsxRangeEnd || normalizedRange === null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setFileHandle(null);
      setPreflight(null);
      setDelimiter("auto");
      setHeader(true);
      setAutoInfer(true);
      setFileType("csv");
      setTableName("");
      setXlsxSheets([]);
      setXlsxSheet("");
      setXlsxPreviewLoading(false);
      setXlsxPreviewColumns([]);
      setXlsxPreviewRows([]);
      setXlsxPreviewProgress(null);
      setXlsxRange(null);
      setXlsxRangeEnabled(false);
      setXlsxRangeStart("1");
      setXlsxRangeEnd("");
      setParquetPreviewLoading(false);
      setParquetPreviewColumns([]);
      setParquetPreviewRows([]);
      setError(null);
      setSubmitting(false);
      setLoadingPreview(false);
    }
  }, [open]);

  useEffect(() => {
    if (xlsxInferenceTooLarge && autoInfer) {
      setAutoInfer(false);
    }
  }, [autoInfer, xlsxInferenceTooLarge]);

  useEffect(() => {
    const runPreflight = async () => {
      if (!file || fileType !== "csv") {
        return;
      }
      setLoadingPreview(true);
      setError(null);
      try {
        const next = await preflightCsv(file);
        setPreflight(next);
        setDelimiter(next.delimiterGuess);
        setTableName(normalizeTableName(file.name));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read CSV.");
      } finally {
        setLoadingPreview(false);
      }
    };
    void runPreflight();
  }, [file, fileType]);

  useEffect(() => {
    const runXlsxPreview = async () => {
      if (!file || fileType !== "xlsx") {
        return;
      }
      setXlsxPreviewLoading(true);
      setError(null);
      try {
        const buffer = await file.arrayBuffer();
        const preview = await requestXlsxPreview(buffer, 0, 0);
        const sheetNames = preview.sheetNames ?? [];
        setXlsxSheets(sheetNames);
        const initialSheet = sheetNames[0] ?? "";
        setXlsxSheet(initialSheet);
        if (initialSheet) {
          const range = preview.usedRanges?.[initialSheet] ?? null;
          setXlsxRange(range ?? null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read Excel.");
      } finally {
        setXlsxPreviewLoading(false);
      }
    };
    void runXlsxPreview();
  }, [file, fileType]);

  useEffect(() => {
    const runParquetPreview = async () => {
      if (!file || fileType !== "parquet") {
        return;
      }
      const duckdb = getDuckDBClient();
      setParquetPreviewLoading(true);
      setError(null);
      try {
        const result = await duckdb.parquetPreview(workspaceId, file, 50);
        setParquetPreviewColumns(result.columns);
        setParquetPreviewRows(result.rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Parquet preview failed.");
      } finally {
        setParquetPreviewLoading(false);
      }
    };
    void runParquetPreview();
  }, [file, fileType, workspaceId]);

  useEffect(() => {
    if (!open || !file || fileType !== "xlsx") {
      return;
    }
    if (!xlsxSheet) {
      setXlsxPreviewColumns([]);
      setXlsxPreviewRows([]);
      return;
    }
    if (xlsxRangeInvalid) {
      return;
    }
    const duckdb = getDuckDBClient();
    const timeout = window.setTimeout(() => {
      setXlsxPreviewLoading(true);
      setXlsxPreviewProgress({ stage: "Loading preview", percent: 0 });
      duckdb
        .xlsxPreview(
          workspaceId,
          file,
          xlsxSheet,
          header,
          normalizedRange,
          50,
          (progress) => {
            setXlsxPreviewProgress(progress);
          }
        )
        .then((result) => {
          setXlsxPreviewColumns(result.columns);
          setXlsxPreviewRows(result.rows);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Excel preview failed.");
        })
        .finally(() => {
          setXlsxPreviewLoading(false);
        });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [
    open,
    file,
    fileType,
    header,
    normalizedRange,
    workspaceId,
    xlsxRangeEnabled,
    xlsxRangeEnd,
    xlsxRangeInvalid,
    xlsxRangeStart,
    xlsxSheet,
  ]);

  const previewDelimiter =
    delimiter === "auto"
      ? preflight?.delimiterGuess ?? "auto"
      : delimiter;
  const previewRows = useMemo(() => {
    if (!preflight) {
      return [];
    }
    return buildPreviewRows(preflight.sampleLines, previewDelimiter);
  }, [preflight, previewDelimiter]);

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);
    setFileHandle(null);
    if (!nextFile) {
      setFileType("csv");
      return;
    }
    const ext = nextFile.name.split(".").pop()?.toLowerCase();
    if (allowExcel && (ext === "xlsx" || ext === "xls")) {
      setFileType("xlsx");
      setPreflight(null);
      setTableName(normalizeTableName(nextFile.name));
      return;
    }
    if (!allowParquet && (ext === "parquet" || ext === "pq")) {
      setError("Parquet import is not enabled.");
      setFile(null);
      setFileType("csv");
      return;
    }
    if (allowParquet && (ext === "parquet" || ext === "pq")) {
      setFileType("parquet");
      setPreflight(null);
      setTableName(normalizeTableName(nextFile.name));
      return;
    }
    setFileType("csv");
  };

  const handlePickFile = async () => {
    if (isBusy) {
      return;
    }
    setError(null);
    if (typeof window !== "undefined" && "showOpenFilePicker" in window) {
      try {
        const picker = (
          window as Window & {
            showOpenFilePicker?: (options?: {
              multiple?: boolean;
              types?: { description?: string; accept?: Record<string, string[]> }[];
            }) => Promise<FileSystemFileHandle[]>;
          }
        ).showOpenFilePicker;
        if (!picker) {
          fileInputRef.current?.click();
          return;
        }
        const accept = {
          "text/csv": [".csv"],
          ...(allowParquet ? { "application/octet-stream": [".parquet", ".pq"] } : {}),
          ...(allowExcel
            ? {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
                  ".xlsx",
                ],
              }
            : {}),
        };
        const [handle] = await picker({
          multiple: false,
          types: [
            {
              description: supportedDescription,
              accept,
            },
          ],
        })!;
        if (!handle) {
          return;
        }
        const picked = await handle.getFile();
        handleFileChange(picked);
        setFileHandle(handle);
        return;
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setError("Could not open the file picker.");
        }
        return;
      }
    }
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Choose a file to import.");
      return;
    }
    const trimmedName = tableName.trim();
    if (!trimmedName) {
      setError("Table name is required.");
      return;
    }
    if (fileType === "xlsx") {
      if (!xlsxSheet) {
        setError("Select a sheet to import.");
        return;
      }
      if (xlsxRangeInvalid) {
        setError("Enter a valid row range.");
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      const ok = await onImport({
        file,
        handle: fileHandle,
        tableName: trimmedName,
        delimiter,
        header,
        autoInfer,
        fileType,
        sheetName: fileType === "xlsx" ? xlsxSheet : undefined,
        sheetRange: fileType === "xlsx" ? normalizedRange : null,
      });
      if (ok) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <ModalOverlay>
      <ModalContent size="lg">
        <ModalHeader
          title="Attach file"
          description={
            `Supported: ${supportedLabel}`
          }
          actions={(
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="px-3 py-1 text-sm"
            >
              Close
            </Button>
          )}
        />

        <div className="mt-4 rounded-xl border border-dashed border-[#D6E2F1] bg-[#F7FAFC] px-4 py-5">
          <input
            ref={fileInputRef}
            type="file"
            accept={
              allowParquet
                ? `.csv,text/csv,.parquet,.pq,application/octet-stream${allowExcel ? ",.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : ""}`
                : allowExcel
                  ? ".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  : ".csv,text/csv"
            }
            className="hidden"
            disabled={isBusy}
            onChange={(event) => {
              handleFileChange(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#0B1220]">
                {file ? file.name : "Choose a file"}
              </p>
              <p className="text-xs text-[#5B6B82]">
                {file
                  ? `${Math.round(file.size / 1024)}KB · ${fileTypeLabel}`
                  : allowParquet || allowExcel
                    ? supportedLabel
                    : "CSV only"}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handlePickFile}
              className="px-3 py-1.5 text-sm"
              disabled={isBusy}
            >
              {file ? "Change file" : "Choose file"}
            </Button>
          </div>
        </div>
        {sessionUsageRatio !== null && sessionUsageRatio >= 0.8 ? (
          <Banner tone="warning" className="mt-4 text-sm">
            You&apos;re close to the session limit. Import as text is recommended.
          </Banner>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs font-semibold text-[#5B6B82]">
            Table name
            <input
              value={tableName}
              onChange={(event) => setTableName(event.target.value)}
              disabled={isBusy}
              className="rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-sm text-[#0B1220]"
              placeholder="customers"
            />
          </label>
          {fileType === "csv" ? (
            <label className="flex flex-col gap-2 text-xs font-semibold text-[#5B6B82]">
              Delimiter
              <select
                value={delimiter}
                onChange={(event) =>
                  setDelimiter(event.target.value as CsvDelimiter)
                }
                disabled={isBusy}
                className="rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-sm text-[#0B1220]"
              >
                {DELIMITER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        {fileType === "csv" ? (
          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-[#5B6B82]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={header}
                onChange={(event) => setHeader(event.target.checked)}
                disabled={isBusy}
                className="h-4 w-4 rounded border-[#D6E2F1]"
              />
              First row contains headers
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoInfer}
                onChange={(event) => setAutoInfer(event.target.checked)}
                disabled={isBusy}
                className="h-4 w-4 rounded border-[#D6E2F1]"
              />
              Auto-detect column types
            </label>
          </div>
        ) : fileType === "parquet" ? (
          <div className="mt-4 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] p-4 text-sm text-[#5B6B82]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
              Parquet options
            </p>
            <p className="mt-2">
              Parquet columns are read automatically. Preview shows the first 50 rows.
            </p>
            <div className="mt-4 rounded-lg border border-[#E6EEF7] bg-white">
              <div className="flex items-center justify-between border-b border-[#E6EEF7] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                Preview
                {parquetPreviewLoading ? (
                  <span className="text-[11px] font-normal text-[#5B6B82]">
                    Loading…
                  </span>
                ) : null}
              </div>
              <div className="max-h-56 overflow-auto">
                {parquetPreviewRows.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-[#5B6B82]">
                    Select a file to preview the first 50 rows.
                  </div>
                ) : (
                  <table className="w-full text-xs text-[#0B1220]">
                    <thead className="bg-[#F7FAFC] text-[11px] uppercase tracking-[0.2em] text-[#5B6B82]">
                      <tr>
                        {parquetPreviewColumns.map((column) => (
                          <th key={column} className="px-3 py-2 text-left">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parquetPreviewRows.map((row, rowIndex) => (
                        <tr key={`parquet-preview-${rowIndex}`}>
                          {parquetPreviewColumns.map((column) => (
                            <td
                              key={`parquet-preview-${rowIndex}-${column}`}
                              className="border-t border-[#E6EEF7] px-3 py-2"
                            >
                              {row[column] === null || row[column] === undefined
                                ? "—"
                                : String(row[column])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ) : fileType === "xlsx" ? (
          <div className="mt-4 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] p-4 text-sm text-[#5B6B82]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
              Excel options
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-[#5B6B82]">
                Sheet
                <select
                  value={xlsxSheet}
                  onChange={(event) => setXlsxSheet(event.target.value)}
                  disabled={isBusy || xlsxSheets.length === 0}
                  className="rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-sm text-[#0B1220]"
                >
                  {xlsxSheets.length === 0 ? (
                    <option value="">No sheets</option>
                  ) : (
                    <>
                      <option value="">Select a sheet</option>
                      {xlsxSheets.map((sheet) => (
                        <option key={sheet} value={sheet}>
                          {sheet}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-[#5B6B82]">
                <input
                  type="checkbox"
                  checked={header}
                  onChange={(event) => setHeader(event.target.checked)}
                  disabled={isBusy}
                  className="h-4 w-4 rounded border-[#D6E2F1]"
                />
                First row contains headers
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#5B6B82]">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={xlsxRangeEnabled}
                  onChange={(event) => setXlsxRangeEnabled(event.target.checked)}
                  disabled={isBusy}
                  className="h-4 w-4 rounded border-[#D6E2F1]"
                />
                Import a range
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoInfer}
                  onChange={(event) => setAutoInfer(event.target.checked)}
                  disabled={isBusy || xlsxInferenceTooLarge}
                  className="h-4 w-4 rounded border-[#D6E2F1]"
                />
                Auto-detect column types
              </label>
            </div>
            {xlsxInferenceTooLarge ? (
              <Banner tone="warning" className="mt-3 text-sm">
                Imported as text for stability. You can change column types in SQL.
              </Banner>
            ) : null}
            {xlsxRangeEnabled ? (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs font-semibold text-[#5B6B82]">
                  Start row
                  <input
                    type="number"
                    min={1}
                    value={xlsxRangeStart}
                    onChange={(event) => setXlsxRangeStart(event.target.value)}
                    disabled={isBusy}
                    className="rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-sm text-[#0B1220]"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold text-[#5B6B82]">
                  End row
                  <input
                    type="number"
                    min={1}
                    value={xlsxRangeEnd}
                    onChange={(event) => setXlsxRangeEnd(event.target.value)}
                    disabled={isBusy}
                    className="rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-sm text-[#0B1220]"
                  />
                </label>
                {xlsxRangeInvalid ? (
                  <p className="md:col-span-2 text-xs text-[#C95757]">
                    Enter a valid start and end row (end must be &gt;= start).
                  </p>
                ) : null}
              </div>
            ) : null}
            {xlsxPreviewProgress ? (
              <Banner tone="info" className="mt-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-[#0B1220]">
                    {xlsxPreviewProgress.stage}
                  </span>
                  {xlsxPreviewProgress.percent !== undefined ? (
                    <span className="tabular-nums text-[#5B6B82]">
                      {Math.round(xlsxPreviewProgress.percent)}%
                    </span>
                  ) : null}
                </div>
              </Banner>
            ) : null}
            <div className="mt-4 rounded-lg border border-[#E6EEF7] bg-white">
              <div className="flex items-center justify-between border-b border-[#E6EEF7] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                Preview
                {xlsxPreviewLoading ? (
                  <span className="text-[11px] font-normal text-[#5B6B82]">
                    Loading…
                  </span>
                ) : null}
              </div>
              <div className="max-h-56 overflow-auto">
                {xlsxPreviewRows.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-[#5B6B82]">
                    Select a sheet to preview the first 50 rows.
                  </div>
                ) : (
                  <table className="w-full text-xs text-[#0B1220]">
                    <thead className="bg-[#F7FAFC] text-[11px] uppercase tracking-[0.2em] text-[#5B6B82]">
                      <tr>
                        {xlsxPreviewColumns.map((column) => (
                          <th key={column} className="px-3 py-2 text-left">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {xlsxPreviewRows.map((row, rowIndex) => (
                        <tr key={`xlsx-preview-${rowIndex}`}>
                          {xlsxPreviewColumns.map((_, cellIndex) => (
                            <td
                              key={`xlsx-preview-${rowIndex}-${cellIndex}`}
                              className="border-t border-[#E6EEF7] px-3 py-2"
                            >
                              {row[cellIndex] === null || row[cellIndex] === undefined
                                ? "—"
                                : String(row[cellIndex])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {isBusy ? (
          <Banner tone="info" className="mt-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-[#0B1220]">
                {progressStage}
              </span>
              {progressPercent ? (
                <span className="tabular-nums text-[#5B6B82]">
                  {progressPercent}
                </span>
              ) : null}
            </div>
            {progress?.percent !== undefined ? (
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E6EEF7]">
                <div
                  className="h-full rounded-full bg-[#003C79] transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
                />
              </div>
            ) : null}
          </Banner>
        ) : null}

        {fileType === "csv" ? (
          <div className="mt-4 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                Preview
              </p>
              {loadingPreview ? (
                <span className="text-xs text-[#5B6B82]">Reading…</span>
              ) : null}
            </div>
            {preflight?.warnings?.length ? (
              <Banner tone="warning" className="mt-2">
                {preflight.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </Banner>
            ) : null}
            <div className="mt-3 max-h-48 overflow-auto rounded-lg border border-[#E6EEF7] bg-white">
              <table className="w-full text-xs text-[#0B1220]">
                <tbody>
                  {previewRows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-2 text-[#5B6B82]">
                        Select a CSV file to preview.
                      </td>
                    </tr>
                  ) : (
                    previewRows.map((row, rowIndex) => (
                      <tr
                        key={`row-${rowIndex}`}
                        className={
                          rowIndex === 0 && header
                            ? "bg-[#EEF4FB] font-semibold"
                            : ""
                        }
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`cell-${rowIndex}-${cellIndex}`}
                            className="border-b border-[#E6EEF7] px-3 py-2"
                          >
                            {cell || "—"}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {error ? (
          <Banner tone="warning" className="mt-4 text-sm">
            {error}
          </Banner>
        ) : null}

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isBusy ||
              !file ||
              (fileType === "xlsx" && (!xlsxSheet || xlsxRangeInvalid))
            }
            className="disabled:opacity-60"
          >
            {submitting ? "Importing…" : "Import"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
