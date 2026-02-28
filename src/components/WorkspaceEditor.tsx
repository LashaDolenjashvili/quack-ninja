"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type * as monaco from "monaco-editor";
import { getDuckDBClient } from "@/src/duckdb/duckdbSingleton";
import type { DuckDBClient } from "@/src/duckdb/client";
import {
  setConsoleRuntime,
  updateConsoleQueryPreview,
  setConsoleDraftSql,
  type AttachedFileMeta,
} from "@/src/duckdb/runtimeCache";
import { enqueueWorkspaceTask } from "@/src/duckdb/taskQueue";
import { FeatureFlags } from "@/src/config/flags";
import { ResultsTable } from "@/src/components/ResultsTable";
import { SaveQueryModal } from "@/src/components/SaveQueryModal";
import { UpgradeModal } from "@/src/components/UpgradeModal";
import { ExportModal } from "@/src/components/ExportModal";
import { WorkspaceTopBar } from "@/src/components/WorkspaceTopBar";
import { CsvImportModal } from "@/src/components/CsvImportModal";
import { Banner } from "@/src/components/ui/banner";
import { logClientError } from "@/src/lib/logger";
import { usePlan } from "@/src/lib/usePlan";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useConsoleSession } from "@/src/components/ConsoleSessionProvider";
import {
  createSavedQuery,
  deleteSavedQuery,
  listAttachedSources,
  replaceAttachedSources,
  type AttachedSourceEntry,
  renameSavedQuery,
} from "@/src/db/indexeddb";
import { normalizeTableName, sanitizeTableName } from "@/src/lib/tableName";
import { formatSqlIdentifier } from "@/src/lib/sqlIdentifiers";
import { type CsvDelimiter } from "@/src/duckdb/csv";
import type { WorkerProgress } from "@/src/lib/duckdb-worker-types";
import { getLimitText } from "@/src/lib/limitText";
import { can } from "@/src/billing/plan";
import { EXAMPLE_QUERIES, getExampleQueryById } from "@/src/lib/exampleQueries";
import { SQL_DIALECT_LABEL, SQL_DIALECT_TOOLTIP } from "@/src/lib/sqlDialect";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

type SchemaTable = {
  name: string;
  columns: { name: string; type: string }[];
};

type ImportFileType = "csv" | "parquet" | "xlsx";

type SingleImportPayload = {
  file: File;
  handle?: FileSystemFileHandle | null;
  tableName: string;
  delimiter: CsvDelimiter;
  header: boolean;
  autoInfer: boolean;
  fileType: ImportFileType;
  sheetName?: string;
  sheetRange?: { startRow: number; endRow: number } | null;
};

type BulkImportPayload = {
  files: Array<{
    file: File;
    handle?: FileSystemFileHandle | null;
    tableName: string;
    delimiter: CsvDelimiter;
    header: boolean;
    autoInfer: boolean;
    fileType: "csv" | "parquet";
  }>;
  mode: "separate" | "merge";
  mergeTableName?: string;
  includeSourceFileName?: boolean;
};

type TabResultState = {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  pageIndex: number;
  runtimeMs: number;
  previewApplied: boolean;
  hasRun: boolean;
};

const CONSOLE_KEY = "console";
const DEFAULT_SQL = "SELECT 1 AS ready;";

function parseSheetRange(range: string | null | undefined) {
  if (!range) {
    return null;
  }
  const [startRaw, endRaw] = range.split(":");
  const startRow = Number(startRaw);
  const endRow = Number(endRaw);
  if (!Number.isFinite(startRow) || !Number.isFinite(endRow)) {
    return null;
  }
  return { startRow, endRow };
}

function toAttachedSourceEntry(
  entry: AttachedFileMeta & { handle?: FileSystemFileHandle | null }
): Omit<AttachedSourceEntry, "id"> {
  return {
    tableName: entry.tableName,
    fileName: entry.fileName,
    sourceType: entry.fileType,
    fileHandle: entry.handle ?? null,
    options: {
      delimiter: entry.csvDelimiter ?? null,
      header: entry.csvHeader ?? true,
      sheetName: entry.sheetName ?? null,
      headerRow: entry.headerRow ?? undefined,
      range: entry.range ?? null,
    },
    inferredTypes: entry.inferredTypes ?? false,
    fileSize: entry.fileSize ?? null,
    attachedAt: entry.createdAt ?? Date.now(),
  };
}

export function WorkspaceEditor() {
  const { plan, entitlements, profile } = usePlan();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supportsParquet = FeatureFlags.ENABLE_PARQUET;
  const supportsExcel = FeatureFlags.ENABLE_XLSX;
  const supportsMultipleFormats = supportsParquet || supportsExcel;
  const attachLabel = "Attach file";
  const attachTypesLabel = supportsMultipleFormats
    ? [
        "CSV",
        supportsParquet ? "Parquet" : null,
        supportsExcel ? "Excel" : null,
      ]
        .filter(Boolean)
        .join(", ")
    : "CSV";
  const {
    consoleId,
    tables: sessionTables,
    setTables: setSessionTables,
    attachedFiles,
    setAttachedFiles,
    totalAttachedBytes,
    queryTabs,
    setQueryTabs,
    activeTabId,
    setActiveTabId,
    savedQueries,
    refreshSavedQueries,
    duckdbRegistrationState,
    setDuckdbRegistrationState,
    persistedAttachments,
    setPersistedAttachments,
    hydrationStatus,
    setLastQueryPreview: setSessionLastQueryPreview,
  } = useConsoleSession();
  const limits = entitlements;
  const limitText = useMemo(() => getLimitText(plan), [plan]);
  const proLimitText = useMemo(() => getLimitText("pro"), []);
  const upgradeTitle = "Billing coming soon";
  const trialUpgradeNote =
    "Payments are being enabled. You can use QuackNinja free in the meantime.";
  const duckdb = useMemo(() => getDuckDBClient(), []);
  const activeTab = useMemo(
    () =>
      queryTabs.find((tab) => tab.id === activeTabId) ??
      queryTabs[0] ??
      null,
    [activeTabId, queryTabs]
  );
  const sql = activeTab?.sql ?? "";
  const updateQueryTab = useCallback(
    (
      tabId: string,
      updates: { sql?: string; name?: string; lastRunSql?: string }
    ) => {
      setQueryTabs((current) =>
        current.map((tab) =>
          tab.id === tabId
            ? {
                ...tab,
                ...updates,
                updatedAt: Date.now(),
              }
            : tab
        )
      );
    },
    [setQueryTabs]
  );
  const updateActiveTab = useCallback(
    (updates: { sql?: string; name?: string; lastRunSql?: string }) => {
      if (!activeTab) {
        return;
      }
      updateQueryTab(activeTab.id, updates);
    },
    [activeTab, updateQueryTab]
  );
  const setTabResult = useCallback(
    (
      tabId: string,
      updater:
        | TabResultState
        | null
        | ((current: TabResultState | null) => TabResultState | null)
    ) => {
      setTabResults((current) => {
        const existing = current[tabId] ?? null;
        const next =
          typeof updater === "function" ? updater(existing) : updater;
        if (!next) {
          const { [tabId]: _removed, ...rest } = current;
          return rest;
        }
        return {
          ...current,
          [tabId]: next,
        };
      });
    },
    []
  );
  const updateActiveTabResult = useCallback(
    (
      updater:
        | TabResultState
        | null
        | ((current: TabResultState | null) => TabResultState | null)
    ) => {
      if (!activeTab) {
        return;
      }
      setTabResult(activeTab.id, updater);
    },
    [activeTab, setTabResult]
  );

  const isTabDirty = useCallback((tab: { sql: string; lastRunSql?: string | null }) => {
    const normalize = (value: string) => value.trim();
    return normalize(tab.sql) !== normalize(tab.lastRunSql ?? tab.sql);
  }, []);

  const handleNewTab = useCallback(() => {
    const nextId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nextIndex = queryTabs.length + 1;
    const nextTab = {
      id: nextId,
      name: `Query ${nextIndex}`,
      sql: DEFAULT_SQL,
      lastRunSql: DEFAULT_SQL,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setQueryTabs((current) => [...current, nextTab]);
    setActiveTabId(nextId);
  }, [queryTabs.length, setActiveTabId, setQueryTabs]);

  const handleRenameTab = useCallback(
    (tabId: string, currentName: string) => {
      const nextName = prompt("Rename tab:", currentName);
      if (!nextName || nextName.trim() === currentName) {
        return;
      }
      setQueryTabs((current) =>
        current.map((tab) =>
          tab.id === tabId
            ? { ...tab, name: nextName.trim(), updatedAt: Date.now() }
            : tab
        )
      );
    },
    [setQueryTabs]
  );

  const handleCloseTab = useCallback(
    (tabId: string) => {
      const tab = queryTabs.find((item) => item.id === tabId);
      if (!tab) {
        return;
      }
      if (isTabDirty(tab)) {
        const confirmClose = confirm(
          "This tab has unsaved changes. Close it anyway?"
        );
        if (!confirmClose) {
          return;
        }
      }
      setQueryTabs((current) => {
        const nextTabs = current.filter((item) => item.id !== tabId);
        if (nextTabs.length === 0) {
          const nextId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const fallbackTab = {
            id: nextId,
            name: "Query 1",
            sql: DEFAULT_SQL,
            lastRunSql: DEFAULT_SQL,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setActiveTabId(nextId);
          return [fallbackTab];
        }
        if (activeTabId === tabId) {
          const nextActive = nextTabs[Math.max(0, nextTabs.length - 1)];
          setActiveTabId(nextActive.id);
        }
        return nextTabs;
      });
    },
    [activeTabId, isTabDirty, queryTabs, setActiveTabId, setQueryTabs]
  );
  const autoLimit = true;
  const [tableCount, setTableCount] = useState(0);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState<string | null>(null);
  const [tabResults, setTabResults] = useState<Record<string, TabResultState>>(
    {}
  );
  const pageSize = 100;
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [schemaFilter, setSchemaFilter] = useState("");
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"results" | "saved">("results");
  const [pendingDeleteQuery, setPendingDeleteQuery] = useState<{
    id: string;
    name: string;
    sql: string;
  } | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeContent, setUpgradeContent] = useState<{
    title: string;
    description: string;
    bullets: string[];
    showUpgrade: boolean;
    bulletsLabel?: string;
  }>({
    title: "Billing coming soon",
    description:
      "Payments are being enabled. You can use QuackNinja free in the meantime.",
    bullets: [],
    showUpgrade: true,
    bulletsLabel: undefined,
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [showSchemaDrawer, setShowSchemaDrawer] = useState(false);
  const [attachmentsHydrated, setAttachmentsHydrated] = useState(false);
  const [copyToastMessage, setCopyToastMessage] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<WorkerProgress | null>(
    null
  );
  const runQueryRef = useRef<() => void>(() => undefined);
  const copyToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const persistedAttachmentsRef = useRef<AttachedFileMeta[]>(persistedAttachments);
  const restoreStateRef = useRef<"idle" | "running" | "done">("idle");
  const restorePromiseRef = useRef<Promise<void> | null>(null);
  const sampleLoadRef = useRef(false);
  const exampleApplyRef = useRef(false);
  const consoleKey = consoleId ?? CONSOLE_KEY;
  const sessionBudgetBytes = limits.maxSessionFileBytes;

  const refreshSchema = useCallback(async () => {
    const tables = await duckdb.listTables(consoleKey);
    const schemaTables = await Promise.all(
      tables.map(async (name) => ({
        name,
        columns: await duckdb.listColumns(consoleKey, name),
      }))
    );
    setSchema(schemaTables);
    setTableCount(tables.length);
    setSessionTables(schemaTables);
  }, [consoleKey, duckdb, setSessionTables]);

  const attachedFilesByTable = useMemo(() => {
    return new Map(attachedFiles.map((entry) => [entry.tableName, entry]));
  }, [attachedFiles]);

  useEffect(() => {
    persistedAttachmentsRef.current = persistedAttachments;
  }, [persistedAttachments]);

  useEffect(() => {
    setTabResults((current) => {
      const validIds = new Set(queryTabs.map((tab) => tab.id));
      let changed = false;
      const next: Record<string, TabResultState> = {};
      for (const [tabId, result] of Object.entries(current)) {
        if (validIds.has(tabId)) {
          next[tabId] = result;
        } else {
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [queryTabs]);

  useEffect(() => {
    restoreStateRef.current = "idle";
  }, [consoleKey]);

  const missingAttachments = useMemo(() => {
    const tableNames = new Set(schema.map((table) => table.name));
    return persistedAttachments.filter(
      (entry) => !tableNames.has(entry.tableName) && !entry.hasHandle
    );
  }, [persistedAttachments, schema]);
  const activeTabResult = activeTab ? (tabResults[activeTab.id] ?? null) : null;

  const isMissingTableError = useCallback((err: unknown) => {
    if (!err) {
      return false;
    }
    const message = err instanceof Error ? err.message : String(err);
    const normalized = message.toLowerCase();
    return normalized.includes("does not exist") || normalized.includes("not found");
  }, []);

  const handleDetachAll = async () => {
    if (attachedFiles.length === 0) {
      return;
    }
    if (!confirm("Detach all tables?")) {
      return;
    }
    setStatus("Detaching");
    setError(null);
    try {
      const tables = await duckdb.listTables(consoleKey);
      for (const tableName of tables) {
        try {
          await duckdb.dropTable(consoleKey, tableName);
        } catch (err) {
          if (!isMissingTableError(err)) {
            logClientError(err, "Detach all drop failed");
          }
        }
      }
      setAttachedFiles([]);
      setConsoleRuntime(consoleKey, {
        attachedFiles: [],
        tables: [],
        importedTables: [],
      });
      setExpandedTables(new Set());
      setSchemaFilter("");
      await refreshSchema();
      await replaceAttachedSources([], consoleKey);
      setPersistedAttachments([]);
      setAttachmentsHydrated(true);
      setDuckdbRegistrationState({
        status: "ready",
        hasHandles: false,
        hasNonHandleAttachments: false,
      });
      setStatus("Ready");
    } catch (err) {
      logClientError(err, "Detach all failed");
      setError(err instanceof Error ? err.message : "Detach failed.");
      setStatus("Error");
    }
  };

  const handleAttachClick = () => {
    setShowCsvImportModal(true);
  };

  const restoreFromHandles = useCallback(
    async (requestPermission: boolean) => {
      if (restorePromiseRef.current) {
        if (requestPermission) {
          await restorePromiseRef.current;
        }
        return;
      }

      restoreStateRef.current = "running";

      restorePromiseRef.current = (async () => {
        const entries = await listAttachedSources(consoleKey);
        const sourceMap = new Map<string, AttachedSourceEntry>();
        for (const entry of entries) {
          const key = `${entry.tableName}::${entry.fileName}::${entry.sourceType}`;
          sourceMap.set(key, entry);
        }
        const baseAttachments = persistedAttachmentsRef.current;
        const hydratedAttachments = baseAttachments.map((entry) => {
          const key = `${entry.tableName}::${entry.fileName}::${entry.fileType}`;
          const match =
            sourceMap.get(key) ??
            entries.find((source) => source.tableName === entry.tableName) ??
            null;
          return {
            ...entry,
            hasHandle: Boolean(match?.fileHandle),
          };
        });
        setPersistedAttachments((current) => {
          if (current.length !== hydratedAttachments.length) {
            return hydratedAttachments;
          }
          const unchanged = current.every((item, index) => {
            const next = hydratedAttachments[index];
            return (
              item.tableName === next.tableName &&
              item.fileName === next.fileName &&
              item.fileType === next.fileType &&
              item.hasHandle === next.hasHandle
            );
          });
          return unchanged ? current : hydratedAttachments;
        });
        const hasNonHandleAttachments = hydratedAttachments.some(
          (entry) => !entry.hasHandle
        );
        const handleEntries = hydratedAttachments.filter((entry) => entry.hasHandle);
        if (entries.length === 0 || handleEntries.length === 0) {
          setDuckdbRegistrationState({
            status: hasNonHandleAttachments ? "blocked" : "ready",
            message: hasNonHandleAttachments
              ? "Please reattach files after refresh."
              : undefined,
            hasHandles: handleEntries.length > 0,
            hasNonHandleAttachments,
          });
          setAttachmentsHydrated(true);
          return;
        }

        setDuckdbRegistrationState({
          status: requestPermission ? "restoring" : "checking",
          hasHandles: handleEntries.length > 0,
          hasNonHandleAttachments,
        });

        let missingPermission = false;
        const restoredTables: (AttachedFileMeta & {
          handle?: FileSystemFileHandle | null;
        })[] = [];

        for (const attachment of hydratedAttachments) {
          if (!attachment.hasHandle) {
            continue;
          }
          const key = `${attachment.tableName}::${attachment.fileName}::${attachment.fileType}`;
          const entry =
            sourceMap.get(key) ??
            entries.find((source) => source.tableName === attachment.tableName);
          if (!entry?.fileHandle) {
            continue;
          }
          const permission = requestPermission
            ? (await entry.fileHandle.requestPermission?.({ mode: "read" })) ??
              "denied"
            : (await entry.fileHandle.queryPermission?.({ mode: "read" })) ??
              "denied";
          if (permission !== "granted") {
            missingPermission = true;
            continue;
          }

          try {
            const file = await entry.fileHandle.getFile();
            const entryType = entry.sourceType ?? "csv";
            if (entryType === "parquet") {
              if (!supportsParquet) {
                continue;
              }
              await enqueueWorkspaceTask(consoleKey, () =>
                duckdb.importParquet(consoleKey, file, entry.tableName)
              );
              restoredTables.push({
                tableName: entry.tableName,
                fileName: file.name,
                fileType: "parquet",
                fileSize: file.size,
                createdAt: Date.now(),
                hasHandle: true,
                handle: entry.fileHandle,
                inferredTypes: true,
              });
            } else if (entryType === "xlsx") {
              if (!supportsExcel) {
                continue;
              }
              const sheetName = entry.options?.sheetName ?? null;
              if (!sheetName) {
                continue;
              }
              const header = entry.options?.headerRow ?? true;
              const range = parseSheetRange(entry.options?.range ?? null);
              await enqueueWorkspaceTask(consoleKey, () =>
                duckdb.importXlsx(consoleKey, file, entry.tableName, {
                  sheetName,
                  header,
                  range,
                  inferTypes: entry.inferredTypes ?? false,
                })
              );
              restoredTables.push({
                tableName: entry.tableName,
                fileName: file.name,
                fileType: "xlsx",
                fileSize: file.size,
                createdAt: Date.now(),
                hasHandle: true,
                handle: entry.fileHandle,
                sheetName,
                range: entry.options?.range ?? null,
                headerRow: header,
                inferredTypes: entry.inferredTypes ?? false,
              });
            } else {
              const entryDelimiter = coerceCsvDelimiter(
                entry.options?.delimiter ?? null
              );
              const csvMeta = await enqueueWorkspaceTask(consoleKey, () =>
                duckdb.importCsvLegacy(
                  consoleKey,
                  file,
                  entry.tableName,
                  {
                    delimiter: entryDelimiter,
                    header: entry.options?.header ?? true,
                  },
                  entry.fileHandle
                )
              );
              if (entry.inferredTypes) {
                const inferenceSizeThreshold = Math.min(
                  512 * 1024 * 1024,
                  limits.maxSessionFileBytes * 0.4
                );
                if (file.size > inferenceSizeThreshold) {
                  setError(
                    `Imported as text to keep things stable. File size ${formatBytes(
                      file.size
                    )} is above ${formatBytes(
                      inferenceSizeThreshold
                    )}. Try changing column types in SQL.`
                  );
                } else {
                  const inferredDelimiter = coerceCsvDelimiter(
                    csvMeta.csvDelimiter ?? entry.options?.delimiter ?? null
                  );
                  try {
                    await enqueueWorkspaceTask(consoleKey, () =>
                      duckdb.inferCsvTypes(
                        consoleKey,
                        entry.tableName,
                        {
                          delimiter: inferredDelimiter,
                          header: entry.options?.header ?? true,
                        }
                      )
                    );
                  } catch (err) {
                    logClientError(err, "Restore type detection failed");
                    setError("Imported as text to keep things stable. You can change column types in SQL.");
                  }
                }
              }
              restoredTables.push({
                tableName: entry.tableName,
                fileName: file.name,
                fileType: "csv",
                fileSize: file.size,
                createdAt: Date.now(),
                hasHandle: true,
                handle: entry.fileHandle,
                csvDelimiter:
                  csvMeta.csvDelimiter ?? entry.options?.delimiter ?? null,
                csvHeader: entry.options?.header ?? true,
                inferredTypes: entry.inferredTypes ?? false,
              });
            }
          } catch (err) {
            logClientError(err, "Restore file failed");
          }
        }

        if (restoredTables.length) {
          setAttachedFiles(restoredTables);
        } else if (!missingPermission) {
          setAttachedFiles([]);
        }

        await refreshSchema();
        setDuckdbRegistrationState({
          status: missingPermission ? "needs-permission" : "ready",
          message: missingPermission
            ? "Your browser requires permission again after refresh."
            : hasNonHandleAttachments
              ? "Please reattach files after refresh."
              : undefined,
          hasHandles: handleEntries.length > 0,
          hasNonHandleAttachments,
        });
        setAttachmentsHydrated(true);
      })()
        .finally(() => {
          restorePromiseRef.current = null;
          restoreStateRef.current = "done";
        });

      await restorePromiseRef.current;
    },
    [
      consoleKey,
      duckdb,
      limits.maxSessionFileBytes,
      refreshSchema,
      setAttachedFiles,
      setDuckdbRegistrationState,
      setPersistedAttachments,
      supportsExcel,
      supportsParquet,
    ]
  );

  const handleCsvImport = useCallback(
    async (payload: SingleImportPayload): Promise<boolean> => {
      const {
        file,
        handle,
        tableName,
        delimiter,
        header,
        autoInfer,
        fileType,
        sheetName,
        sheetRange,
      } = payload;
      if (fileType === "parquet" && !supportsParquet) {
        setError("Parquet isn’t available in this version.");
        return false;
      }
      if (fileType === "xlsx" && !supportsExcel) {
        setError("Excel isn’t available in this version.");
        return false;
      }
      if (importing) {
        const message = "Tables are still importing—please wait.";
        setError(message);
        throw new Error(message);
      }
      const fileGate = can("attach_file", { plan, fileSize: file.size });
      if (fileGate !== true) {
        if (plan === "pro") {
          setError(
            `This file is larger than your limit. Try a smaller file or split it.`
          );
          return false;
        } else {
          setUpgradeContent({
            title: upgradeTitle,
            description: trialUpgradeNote,
            bullets: [],
            showUpgrade: true,
          });
        }
        setShowUpgradeModal(true);
        return false;
      }
      const nextTotal = totalAttachedBytes + file.size;
      const inferenceThresholdBytes = limits.maxSessionFileBytes * 0.8;
      const inferenceSizeThreshold = Math.min(
        512 * 1024 * 1024,
        limits.maxSessionFileBytes * 0.4
      );
      const skipInference =
        autoInfer && nextTotal >= inferenceThresholdBytes;
      const skipInferenceBySize =
        autoInfer && file.size > inferenceSizeThreshold;
      const sessionGate = can("attach_total", {
        plan,
        totalSize: nextTotal,
      });
      if (sessionGate !== true) {
        if (plan === "pro") {
          setError(
            "You're at the session limit. Detach a table or use smaller files."
          );
          return false;
        } else {
          setUpgradeContent({
            title: upgradeTitle,
            description: trialUpgradeNote,
            bullets: [],
            showUpgrade: true,
          });
        }
        setShowUpgradeModal(true);
        return false;
      }

      setImporting(true);
      setImportProgress({ stage: "Registering file" });
      setStatus("Importing");
      setError(null);
      try {
        const existing = await duckdb.listTables(consoleKey);
        const defaultName = normalizeTableName(file.name);
        const trimmedName = tableName.trim() || defaultName;
        let resolvedName = trimmedName;
        if (existing.includes(resolvedName)) {
          if (resolvedName === defaultName) {
            resolvedName = sanitizeTableName(resolvedName, existing);
          } else {
            const confirmed = confirm(
              `Table "${resolvedName}" already exists. Replace it?`
            );
            if (!confirmed) {
              return false;
            }
            await duckdb.dropTable(consoleKey, resolvedName);
          }
        }

        const result = await enqueueWorkspaceTask(consoleKey, async () => {
          if (fileType === "parquet") {
            return duckdb.importParquet(
              consoleKey,
              file,
              resolvedName,
              (progress) => {
                if (progress.stage) {
                  setStatus(progress.stage);
                }
                setImportProgress(progress);
              }
            );
          }
          if (fileType === "xlsx") {
            if (!sheetName) {
              throw new Error("Select a sheet to import.");
            }
            return duckdb.importXlsx(
              consoleKey,
              file,
              resolvedName,
              {
                sheetName,
                header,
                range: sheetRange ?? null,
                inferTypes: autoInfer && !skipInference && !skipInferenceBySize,
              },
              (progress) => {
                if (progress.stage) {
                  setStatus(progress.stage);
                }
                setImportProgress(progress);
              }
            );
          }
          return duckdb.importCsvLegacy(
            consoleKey,
            file,
            resolvedName,
            {
              delimiter,
              header,
            },
            handle,
            (progress) => {
              if (progress.stage) {
                setStatus(progress.stage);
              }
              setImportProgress(progress);
            }
          );
        });
        let inferredTypes = fileType === "parquet";
        if (fileType === "xlsx" && autoInfer && !skipInference && !skipInferenceBySize) {
          inferredTypes = true;
        }
        if (fileType === "csv" && autoInfer && !skipInference && !skipInferenceBySize) {
          try {
            setStatus("Detecting column types");
            setImportProgress({ stage: "Detecting column types" });
            const inferredDelimiter = coerceCsvDelimiter(
              result.csvDelimiter ?? delimiter
            );
            await enqueueWorkspaceTask(consoleKey, async () =>
              duckdb.inferCsvTypes(
                consoleKey,
                resolvedName,
                {
                  delimiter: inferredDelimiter,
                  header,
                },
                (progress) => {
                  if (progress.stage) {
                    setStatus(progress.stage);
                  }
                  setImportProgress(progress);
                }
              )
            );
            inferredTypes = true;
          } catch (err) {
            logClientError(err, "Auto-detect column types failed");
            setError(
              `Imported as text to keep things stable. Session usage is ${formatBytes(
                nextTotal
              )} / ${formatBytes(
                limits.maxSessionFileBytes
              )}. Try detaching tables, splitting files, or changing column types in SQL.`
            );
          }
        } else if (autoInfer && (skipInference || skipInferenceBySize)) {
          const reason = skipInferenceBySize
            ? `File size ${formatBytes(file.size)} is above the safe limit for auto-detect.`
            : `Session usage is ${formatBytes(nextTotal)} / ${formatBytes(
                limits.maxSessionFileBytes
              )}.`;
          setError(
            `Imported as text to keep things stable. ${reason} Try detaching tables, splitting files, or changing column types in SQL.`
          );
        }

        const entry: AttachedFileMeta & {
          handle?: FileSystemFileHandle | null;
        } = {
          tableName: resolvedName,
          fileName: file.name,
          fileType:
            fileType === "parquet"
              ? "parquet"
              : fileType === "xlsx"
                ? "xlsx"
                : "csv",
          fileSize: file.size,
          createdAt: Date.now(),
          hasHandle: Boolean(handle),
          handle,
          sheetName: fileType === "xlsx" ? sheetName ?? null : undefined,
          range:
            fileType === "xlsx" && sheetRange
              ? `${sheetRange.startRow}:${sheetRange.endRow}`
              : null,
          headerRow: fileType === "xlsx" ? header : undefined,
          headerRowIndex:
            fileType === "xlsx"
              ? header
                ? (sheetRange?.startRow ?? 1) - 1
                : null
              : undefined,
          csvDelimiter:
            fileType === "csv" ? result.csvDelimiter ?? delimiter : null,
          csvHeader: fileType === "csv" ? header : undefined,
          inferredTypes,
        };
        setAttachedFiles((current) => {
          const without = current.filter(
            (item) => item.tableName !== resolvedName
          );
          return [...without, entry];
        });
        await refreshSchema();
        return true;
      } catch (err) {
        logClientError(err, "File import failed");
        const message = getFriendlyErrorMessage(err, {
          sessionUsageBytes: totalAttachedBytes,
          sessionCapBytes: limits.maxSessionFileBytes,
        });
        setError(message);
        throw new Error(message);
      } finally {
        setImporting(false);
        setImportProgress(null);
        setStatus("Ready");
      }
    },
    [
      consoleKey,
      duckdb,
      importing,
      limits,
      plan,
      refreshSchema,
      setAttachedFiles,
      setShowUpgradeModal,
      setUpgradeContent,
      supportsExcel,
      supportsParquet,
      totalAttachedBytes,
      trialUpgradeNote,
      upgradeTitle,
    ]
  );

  const handleBulkImport = useCallback(
    async (payload: BulkImportPayload): Promise<boolean> => {
      if (importing) {
        const message = "Tables are still importing—please wait.";
        setError(message);
        throw new Error(message);
      }
      if (payload.files.length < 2) {
        setError("Choose at least two files for bulk import.");
        return false;
      }
      const totalIncomingBytes = payload.files.reduce(
        (sum, item) => sum + item.file.size,
        0
      );
      for (const item of payload.files) {
        const fileGate = can("attach_file", { plan, fileSize: item.file.size });
        if (fileGate !== true) {
          setError(
            "One or more files are larger than your plan limit. Split them and try again."
          );
          return false;
        }
      }
      const sessionGate = can("attach_total", {
        plan,
        totalSize: totalAttachedBytes + totalIncomingBytes,
      });
      if (sessionGate !== true) {
        if (plan === "pro") {
          setError("You're at the session limit. Detach a table or use smaller files.");
          return false;
        }
        setUpgradeContent({
          title: upgradeTitle,
          description: trialUpgradeNote,
          bullets: [],
          showUpgrade: true,
        });
        setShowUpgradeModal(true);
        return false;
      }

      if (payload.mode === "separate") {
        for (const item of payload.files) {
          const ok = await handleCsvImport({
            file: item.file,
            handle: item.handle ?? null,
            tableName: item.tableName,
            delimiter: item.delimiter,
            header: item.header,
            autoInfer: item.autoInfer,
            fileType: item.fileType,
          });
          if (!ok) {
            return false;
          }
        }
        return true;
      }

      const mergeNameInput = payload.mergeTableName?.trim();
      if (!mergeNameInput) {
        setError("Merged table name is required.");
        return false;
      }
      const includeSourceFileName = payload.includeSourceFileName ?? true;
      const normalizedDefaultMergeName = normalizeTableName(mergeNameInput);
      const usedNames = new Set<string>(await duckdb.listTables(consoleKey));
      let mergeTableName = normalizedDefaultMergeName;
      if (usedNames.has(mergeTableName)) {
        mergeTableName = sanitizeTableName(mergeTableName, Array.from(usedNames));
      }

      const inferenceSizeThreshold = Math.min(
        512 * 1024 * 1024,
        limits.maxSessionFileBytes * 0.4
      );
      const tempTables: string[] = [];
      setImporting(true);
      setStatus("Importing");
      setError(null);
      try {
        for (const [index, item] of payload.files.entries()) {
          const tempName = sanitizeTableName(
            `${item.tableName}_bulk_tmp_${index + 1}`,
            Array.from(usedNames)
          );
          usedNames.add(tempName);
          tempTables.push(tempName);
          if (item.fileType === "parquet") {
            await enqueueWorkspaceTask(consoleKey, () =>
              duckdb.importParquet(consoleKey, item.file, tempName, (progress) => {
                if (progress.stage) {
                  setStatus(progress.stage);
                }
                setImportProgress(progress);
              })
            );
            continue;
          }
          const csvMeta = await enqueueWorkspaceTask(consoleKey, () =>
            duckdb.importCsvLegacy(
              consoleKey,
              item.file,
              tempName,
              {
                delimiter: item.delimiter,
                header: item.header,
              },
              item.handle,
              (progress) => {
                if (progress.stage) {
                  setStatus(progress.stage);
                }
                setImportProgress(progress);
              }
            )
          );
          if (item.autoInfer && item.file.size <= inferenceSizeThreshold) {
            const inferredDelimiter = coerceCsvDelimiter(
              csvMeta.csvDelimiter ?? item.delimiter
            );
            await enqueueWorkspaceTask(consoleKey, () =>
              duckdb.inferCsvTypes(
                consoleKey,
                tempName,
                {
                  delimiter: inferredDelimiter,
                  header: item.header,
                },
                (progress) => {
                  if (progress.stage) {
                    setStatus(progress.stage);
                  }
                  setImportProgress(progress);
                }
              )
            );
          }
        }

        const schemas = await Promise.all(
          tempTables.map((tableName) => duckdb.listColumns(consoleKey, tableName))
        );
        const baseSchema = schemas[0] ?? [];
        for (let i = 1; i < schemas.length; i += 1) {
          const current = schemas[i] ?? [];
          const sameLength = current.length === baseSchema.length;
          const sameColumns =
            sameLength &&
            current.every((column, colIndex) => {
              const base = baseSchema[colIndex];
              return (
                base &&
                base.name === column.name &&
                base.type.toLowerCase() === column.type.toLowerCase()
              );
            });
          if (!sameColumns) {
            throw new Error(
              "Files cannot be merged automatically. Column names and column types must match across all selected files."
            );
          }
        }

        const mergeSql = `CREATE TABLE ${formatSqlIdentifier(mergeTableName)} AS ${tempTables
          .map((tableName, index) => {
            const baseSelect = `SELECT * FROM ${formatSqlIdentifier(tableName)}`;
            if (!includeSourceFileName) {
              return baseSelect;
            }
            const fileNameLiteral = toSqlStringLiteral(
              payload.files[index]?.file.name ?? ""
            );
            return `SELECT *, ${fileNameLiteral} AS source_file_name FROM ${formatSqlIdentifier(tableName)}`;
          })
          .join(" UNION ALL ")}`;
        await enqueueWorkspaceTask(consoleKey, () => duckdb.query(consoleKey, mergeSql));
        for (const tempName of tempTables) {
          await enqueueWorkspaceTask(consoleKey, () =>
            duckdb.dropTable(consoleKey, tempName)
          );
        }
        const combinedEntry: AttachedFileMeta = {
          tableName: mergeTableName,
          fileName: `${payload.files.length} files (merged)`,
          fileType: payload.files.every((item) => item.fileType === "parquet")
            ? "parquet"
            : "csv",
          fileSize: totalIncomingBytes,
          createdAt: Date.now(),
          hasHandle: false,
          inferredTypes: payload.files.every((item) => item.fileType === "parquet")
            ? true
            : payload.files.every((item) => item.autoInfer),
        };
        setAttachedFiles((current) => {
          const withoutMerged = current.filter(
            (entry) => entry.tableName !== mergeTableName
          );
          return [...withoutMerged, combinedEntry];
        });
        await refreshSchema();
        return true;
      } catch (err) {
        for (const tempName of tempTables) {
          try {
            await enqueueWorkspaceTask(consoleKey, () =>
              duckdb.dropTable(consoleKey, tempName)
            );
          } catch {
            // Best effort cleanup.
          }
        }
        logClientError(err, "Bulk merge import failed");
        const message = getFriendlyErrorMessage(err, {
          sessionUsageBytes: totalAttachedBytes,
          sessionCapBytes: limits.maxSessionFileBytes,
        });
        setError(message);
        throw new Error(message);
      } finally {
        setImporting(false);
        setImportProgress(null);
        setStatus("Ready");
      }
    },
    [
      consoleKey,
      duckdb,
      handleCsvImport,
      importing,
      limits.maxSessionFileBytes,
      plan,
      refreshSchema,
      setAttachedFiles,
      totalAttachedBytes,
      trialUpgradeNote,
      upgradeTitle,
    ]
  );

  const loadSampleTables = useCallback(async () => {
    const samples = [
      { fileName: "customers.csv", tableName: "customers" },
      { fileName: "transactions.csv", tableName: "transactions" },
      { fileName: "payments.csv", tableName: "payments" },
    ];
    for (const sample of samples) {
      const response = await fetch(`/samples/${sample.fileName}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${sample.fileName}`);
      }
      const blob = await response.blob();
      const file = new File([blob], sample.fileName, { type: "text/csv" });
      const ok = await handleCsvImport({
        file,
        tableName: sample.tableName,
        delimiter: ",",
        header: true,
        autoInfer: true,
        fileType: "csv",
      });
      if (!ok) {
        throw new Error(`Sample import failed for ${sample.tableName}`);
      }
    }
  }, [handleCsvImport]);

  useEffect(() => {
    const loadSamples = searchParams?.get("loadSamples");
    if (loadSamples !== "1" || sampleLoadRef.current) {
      return;
    }
    sampleLoadRef.current = true;
    void (async () => {
      try {
        await loadSampleTables();
        setCopyToastMessage(
          "Loaded sample tables: customers, transactions, payments"
        );
      } catch (err) {
        logClientError(err, "Sample load failed");
        setError("Couldn't load sample data. Please try again.");
      } finally {
        router.replace("/app/console");
      }
    })();
  }, [loadSampleTables, router, searchParams]);

  useEffect(() => {
    const exampleId = searchParams?.get("example");
    if (!exampleId || exampleApplyRef.current || !activeTab) {
      return;
    }
    const example = getExampleQueryById(exampleId);
    if (example) {
      updateActiveTab({ sql: example.sql });
      setActivePanel("results");
    }
    exampleApplyRef.current = true;
    router.replace("/app/console");
  }, [activeTab, router, searchParams, updateActiveTab]);

  const pickFileForType = useCallback(
    async (sourceType: "csv" | "xlsx" | "parquet") => {
      const acceptMap: Record<
        "csv" | "xlsx" | "parquet",
        { description: string; accept: Record<string, string[]>; acceptText: string }
      > = {
        csv: {
          description: "CSV file",
          accept: { "text/csv": [".csv"] },
          acceptText: ".csv,text/csv",
        },
        xlsx: {
          description: "Excel file",
          accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
              ".xlsx",
            ],
          },
          acceptText: ".xlsx",
        },
        parquet: {
          description: "Parquet file",
          accept: { "application/octet-stream": [".parquet"] },
          acceptText: ".parquet",
        },
      };
      if (typeof window !== "undefined" && "showOpenFilePicker" in window) {
        try {
          const picker = (
            window as Window & {
              showOpenFilePicker?: (options?: {
                multiple?: boolean;
                types?: { description: string; accept: Record<string, string[]> }[];
              }) => Promise<FileSystemFileHandle[]>;
            }
          ).showOpenFilePicker;
          if (picker) {
            const [handle] = await picker({
              multiple: false,
              types: [
                {
                  description: acceptMap[sourceType].description,
                  accept: acceptMap[sourceType].accept,
                },
              ],
            });
            if (!handle) {
              return null;
            }
            const file = await handle.getFile();
            return { file, handle };
          }
        } catch {
          return null;
        }
      }
      return await new Promise<{ file: File; handle?: FileSystemFileHandle | null } | null>(
        (resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = acceptMap[sourceType].acceptText;
          input.onchange = () => {
            const file = input.files?.[0];
            resolve(file ? { file, handle: null } : null);
          };
          input.click();
        }
      );
    },
    []
  );

  const handleReattachSource = useCallback(
    async (entry: AttachedFileMeta) => {
      const picked = await pickFileForType(entry.fileType);
      if (!picked) {
        return;
      }
      const delimiter = coerceCsvDelimiter(entry.csvDelimiter);
      const header =
        entry.fileType === "xlsx"
          ? entry.headerRow ?? true
          : entry.csvHeader ?? true;
      const sheetRange = parseSheetRange(entry.range ?? null);
      try {
        await handleCsvImport({
          file: picked.file,
          handle: picked.handle ?? null,
          tableName: entry.tableName,
          delimiter,
          header,
          autoInfer: entry.inferredTypes ?? false,
          fileType: entry.fileType,
          sheetName: entry.sheetName ?? undefined,
          sheetRange,
        });
      } catch (err) {
        logClientError(err, "Reattach failed");
        setError("Reattach failed. Please try again.");
      }
    },
    [handleCsvImport, pickFileForType]
  );

  useEffect(() => {
    refreshSavedQueries();
  }, [consoleKey, refreshSavedQueries]);

  useEffect(() => {
    setConsoleRuntime(consoleKey, { lastOpenedAt: Date.now() });
    const runtimeHasAttachments =
      persistedAttachments.length > 0 || attachedFiles.length > 0;
    if (
      sessionTables.length &&
      (attachmentsHydrated || attachedFiles.length > 0) &&
      hydrationStatus !== "booting"
    ) {
      setSchema(sessionTables);
      setTableCount(sessionTables.length);
    } else if (!runtimeHasAttachments) {
      setSchema([]);
      setTableCount(0);
    }
    const canRestore = hydrationStatus === "hydrated";
    if (canRestore && attachedFiles.length === 0 && restoreStateRef.current === "idle") {
      restoreFromHandles(false);
    } else if (attachedFiles.length > 0) {
      setAttachmentsHydrated(true);
    }
  }, [
    duckdb,
    consoleKey,
    attachedFiles.length,
    attachmentsHydrated,
    sessionTables,
    setAttachedFiles,
    setDuckdbRegistrationState,
    hydrationStatus,
    persistedAttachments.length,
    restoreFromHandles,
  ]);

  useEffect(() => {
    if (hydrationStatus === "hydrated" && attachedFiles.length === 0) {
      restoreStateRef.current = "idle";
    }
  }, [hydrationStatus, attachedFiles.length]);

  useEffect(() => {
    if (!activeTab) {
      return;
    }
    setConsoleDraftSql(consoleKey, activeTab.sql);
  }, [consoleKey, activeTab]);

  useEffect(() => {
    if (selectedTable && !schema.some((table) => table.name === selectedTable)) {
      setSelectedTable(null);
    }
  }, [schema, selectedTable]);

  useEffect(() => {
    if (!attachmentsHydrated) {
      return;
    }
    if (attachedFiles.length === 0) {
      return;
    }
    const snapshot = attachedFiles.map((entry) => {
      const rest = { ...entry };
      delete (rest as { handle?: FileSystemFileHandle | null }).handle;
      return rest;
    });
    setPersistedAttachments(snapshot);
    const syncSources = async () => {
      const merged = new Map<string, Omit<AttachedSourceEntry, "id">>();
      for (const entry of attachedFiles) {
        merged.set(entry.tableName, toAttachedSourceEntry(entry));
      }
      await replaceAttachedSources(Array.from(merged.values()), consoleKey);
    };
    void syncSources();
  }, [attachedFiles, attachmentsHydrated, consoleKey, setPersistedAttachments]);

  const executeQueryForTab = useCallback(
    async (tabId: string, sqlText: string) => {
      if (importing) {
        setError("Tables are still importing—please wait.");
        return;
      }
      setStatus("Running");
      setError(null);
      const { sql: finalSql, previewed } = applyAutoLimit(
        sqlText,
        autoLimit,
        limits.previewLimit
      );
      updateQueryTab(tabId, { lastRunSql: sqlText });
      try {
        const result = await enqueueWorkspaceTask(consoleKey, async () =>
          duckdb.query(consoleKey, finalSql)
        );
        setTabResult(tabId, {
          columns: result.columns,
          rows: result.rows.slice(0, limits.maxRenderRows),
          rowCount: result.rowCount,
          pageIndex: 0,
          runtimeMs: result.elapsedMs,
          previewApplied: previewed,
          hasRun: true,
        });
        updateConsoleQueryPreview(
          consoleKey,
          result.rowCount,
          result.elapsedMs
        );
        setSessionLastQueryPreview({
          rows: result.rowCount,
          runtimeMs: result.elapsedMs,
        });
        await refreshSchema();
        await refreshSavedQueries();
        setStatus("Ready");
      } catch (err) {
        setStatus("Error");
        logClientError(err, "Query failed");
        setError(
          getFriendlyErrorMessage(err, {
            sessionUsageBytes: totalAttachedBytes,
            sessionCapBytes: limits.maxSessionFileBytes,
          })
        );
      }
    },
    [
      autoLimit,
      consoleKey,
      duckdb,
      importing,
      limits.maxRenderRows,
      limits.maxSessionFileBytes,
      limits.previewLimit,
      refreshSavedQueries,
      refreshSchema,
      setSessionLastQueryPreview,
      setTabResult,
      totalAttachedBytes,
      updateQueryTab,
    ]
  );

  const runQuery = useCallback(async () => {
    if (!activeTab) {
      return;
    }
    await executeQueryForTab(activeTab.id, activeTab.sql);
  }, [activeTab, executeQueryForTab]);

  const clearQuery = () => {
    updateActiveTab({ sql: "" });
    updateActiveTabResult(null);
    setError(null);
  };

  const handleProfileTable = useCallback(
    async (table: SchemaTable) => {
      const profileSql = buildTableProfileSql(table);
      const nextId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const nextTab = {
        id: nextId,
        name: `Summary: ${table.name}`,
        sql: profileSql,
        lastRunSql: profileSql,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setQueryTabs((current) => [...current, nextTab]);
      setActivePanel("results");
      setActiveTabId(nextId);
      await executeQueryForTab(nextId, profileSql);
    },
    [executeQueryForTab, setActiveTabId, setQueryTabs]
  );

  const insertSqlSnippet = useCallback(
    (snippet: string) => {
      const editor = editorRef.current;
      if (editor) {
        const selection = editor.getSelection();
        if (selection) {
          editor.executeEdits("insert-helper", [
            { range: selection, text: snippet, forceMoveMarkers: true },
          ]);
          const nextValue = editor.getValue();
          updateActiveTab({ sql: nextValue });
          editor.focus();
          return;
        }
      }
      updateActiveTab({ sql: `${sql}\n${snippet}`.trim() });
    },
    [sql, updateActiveTab]
  );

  const handleSaveClick = () => {
    const saveGate = can("save_query", {
      plan,
      activeCount: savedQueries.length,
    });
    if (saveGate !== true) {
      setUpgradeContent({
        title: upgradeTitle,
        description: trialUpgradeNote,
        bullets: [],
        showUpgrade: true,
      });
      setShowUpgradeModal(true);
      return;
    }
    if (!sql.trim()) {
    setError("Enter SQL before saving.");
      return;
    }
    setShowSaveModal(true);
  };

  const handleSaveQuery = async (name: string) => {
    if (!name) {
      return;
    }
    const existingNames = new Set(
      savedQueries.map((query) => query.name.toLowerCase())
    );
    let finalName = name;
    if (existingNames.has(name.toLowerCase())) {
      let counter = 2;
      while (existingNames.has(`${name} ${counter}`.toLowerCase())) {
        counter += 1;
      }
      finalName = `${name} ${counter}`;
    }
    await createSavedQuery(finalName, sql);
    setShowSaveModal(false);
    await refreshSavedQueries();
  };

  const handleDeleteSavedQuery = async (id: string) => {
    const query = savedQueries.find((item) => item.id === id);
    if (!query) {
      return;
    }
    setPendingDeleteQuery(query);
  };

  const confirmDeleteSavedQuery = async () => {
    if (!pendingDeleteQuery) {
      return;
    }
    await deleteSavedQuery(pendingDeleteQuery.id);
    setPendingDeleteQuery(null);
    await refreshSavedQueries();
  };

  const handleRenameSavedQuery = async (id: string, currentName: string) => {
    const nextName = prompt("Rename saved query:", currentName);
    if (!nextName || nextName.trim() === currentName) {
      return;
    }
    await renameSavedQuery(id, nextName.trim());
    await refreshSavedQueries();
  };

  const toggleTable = (name: string) => {
    setSelectedTable(name);
    setExpandedTables((current) => {
      const next = new Set(current);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleRenameTable = async (currentName: string) => {
    const nextName = prompt("Rename table:", currentName);
    if (!nextName || nextName.trim() === currentName) {
      return;
    }
    try {
      await duckdb.renameTable(consoleKey, currentName, nextName.trim());
      setAttachedFiles((current) =>
        current.map((entry) =>
          entry.tableName === currentName
            ? { ...entry, tableName: nextName.trim() }
            : entry
        )
      );
      setPersistedAttachments((current) =>
        current.map((entry) =>
          entry.tableName === currentName
            ? { ...entry, tableName: nextName.trim() }
            : entry
        )
      );
      await refreshSchema();
    } catch (err) {
      logClientError(err, "Rename table failed");
      setError(err instanceof Error ? err.message : "Rename failed.");
    }
  };

  const handleCopyTable = async (sourceName: string) => {
    const nextName = prompt("Copy table to:", `${sourceName}_copy`);
    if (!nextName || nextName.trim() === sourceName) {
      return;
    }
    try {
      await duckdb.copyTable(consoleKey, sourceName, nextName.trim());
      await refreshSchema();
    } catch (err) {
      logClientError(err, "Copy table failed");
      setError(err instanceof Error ? err.message : "Copy failed.");
    }
  };

  const handleCopyTableName = useCallback(async (tableName: string, label?: string) => {
    const identifier = formatSqlIdentifier(tableName);
    try {
      await navigator.clipboard.writeText(identifier);
      setCopyToastMessage(label ?? "Copied table name");
      if (copyToastTimer.current) {
        clearTimeout(copyToastTimer.current);
      }
      copyToastTimer.current = setTimeout(() => {
        setCopyToastMessage(null);
      }, 1500);
    } catch (err) {
      logClientError(err, "Copy table name failed");
      setError("Copy failed.");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (copyToastTimer.current) {
        clearTimeout(copyToastTimer.current);
      }
    };
  }, []);

  const handleDeleteTable = async (tableName: string) => {
    if (!confirm(`Delete table "${tableName}"?`)) {
      return;
    }
    try {
      await duckdb.dropTable(consoleKey, tableName);
      setAttachedFiles((current) =>
        current.filter((entry) => entry.tableName !== tableName)
      );
      setPersistedAttachments((current) =>
        current.filter((entry) => entry.tableName !== tableName)
      );
      await refreshSchema();
    } catch (err) {
      logClientError(err, "Delete table failed");
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const handleExport = async (options: {
    format: "csv";
    splitEnabled: boolean;
    rowsPerFile: number;
  }) => {
    setError(null);
    const trimmedSql = sql.trim();
    if (!trimmedSql) {
      setError("Enter SQL before exporting.");
      return;
    }
    if (!/^(select|with)\b/i.test(trimmedSql)) {
      setError("Only SELECT statements can be exported.");
      return;
    }
    const exportSql = trimmedSql.replace(/;+\s*$/, "");
    const exportLimit =
      options.splitEnabled && limits.splitExportEnabled
        ? splitExportRowCount
        : exportRowCount;
    const exportSqlLimited =
      exportLimit !== null
        ? `SELECT * FROM (${exportSql}) AS fs_export LIMIT ${exportLimit}`
        : exportSql;

    if (options.splitEnabled) {
      const splitGate = can("split_export", { plan });
      if (splitGate !== true) {
        setUpgradeContent({
          title: upgradeTitle,
          description: trialUpgradeNote,
          bullets: [],
          showUpgrade: true,
        });
        setShowUpgradeModal(true);
        return;
      }
    }

    const blockedReason = options.splitEnabled
      ? splitBlockedReason
      : exportBlockedReason;
    if (blockedReason) {
      setError(blockedReason);
      return;
    }

    setExporting(true);
    setShowExportModal(false);

    try {
      if (FeatureFlags.EXPORT_LIMITS_ENABLED && exportLimit === 0) {
        setError("Export has no rows.");
        return;
      }

      if (options.splitEnabled) {
        await enqueueWorkspaceTask(consoleKey, async () =>
          exportSplitFiles(
            consoleKey,
            exportSqlLimited,
            options,
            duckdb,
            limits.exportMaxRows
          )
        );
      } else {
        const buffer = await enqueueWorkspaceTask(consoleKey, async () =>
          duckdb.exportQuery(
            consoleKey,
            exportSqlLimited,
            options.format,
            "filesql-export"
          )
        );
        downloadBuffer(buffer, `filesql-export.${options.format}`);
      }
    } catch (err) {
      logClientError(err, "Export failed");
      setError(
        getFriendlyErrorMessage(err, {
          sessionUsageBytes: totalAttachedBytes,
          sessionCapBytes: limits.maxSessionFileBytes,
        })
      );
    } finally {
      setExporting(false);
    }
  };

  const resultColumns = activeTabResult?.columns ?? [];
  const resultRows = activeTabResult?.rows ?? [];
  const resultRowCount = activeTabResult?.rowCount ?? 0;
  const pageIndex = activeTabResult?.pageIndex ?? 0;
  const previewApplied = activeTabResult?.previewApplied ?? false;
  const resultRuntimeMs = activeTabResult?.runtimeMs ?? 0;
  const previewRowLabel = resultRows.length.toLocaleString();
  const rowCountColor = getRowCountColor(resultRowCount);
  const exportPlan = getExportPlan(sql, limits.exportMaxRows);
  const sqlLimit = getSqlLimit(sql);
  const exportRowCount = exportPlan.limit ?? 0;
  const splitExportCap = limits.exportMaxRows;
  const splitExportRowCount =
    sqlLimit !== null ? Math.min(sqlLimit, splitExportCap) : splitExportCap;
  const exportBlockedReason = getExportBlockedReason(
    exportRowCount,
    limits.exportMaxRows
  );
  const splitBlockedReason = limits.splitExportEnabled
    ? getExportBlockedReason(
        splitExportRowCount,
        limits.exportMaxRows
      )
    : null;
  const pageCount = Math.max(1, Math.ceil(resultRows.length / pageSize));
  const pageRows = resultRows.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );
  const showRestoreBanner =
    duckdbRegistrationState.status === "needs-permission" &&
    attachedFiles.length === 0 &&
    duckdbRegistrationState.hasHandles;
  const showReattachBanner =
    duckdbRegistrationState.status === "blocked" &&
    attachedFiles.length === 0 &&
    duckdbRegistrationState.hasNonHandleAttachments;
  const trimmedSql = sql.trim();
  const hasRun = activeTabResult?.hasRun ?? false;
  const runDisabled = !trimmedSql || tableCount === 0;
  const runDisabledReason =
    tableCount === 0 ? "Attach a file first" : "Enter SQL to run";
  const exportDisabled = exporting || exportRowCount === 0 || !trimmedSql;
  const showingSuffix =
    sqlLimit !== null ? "LIMIT" : previewApplied ? "Preview" : null;
  const showingLabel = hasRun
    ? showingSuffix
      ? `${previewRowLabel} (${showingSuffix})`
      : previewRowLabel
    : "No results yet";
  const runtimeLabel = hasRun ? formatRuntimeMs(resultRuntimeMs) : null;
  const exportCapLabel = `${limitText.exportRows} (${plan === "pro" ? "Pro" : "Free"})`;
  const preferredTable = useMemo(() => {
    if (selectedTable) {
      return selectedTable;
    }
    return schema[0]?.name ?? null;
  }, [schema, selectedTable]);
  const sessionRemainingBytes = Math.max(
    limits.maxSessionFileBytes - totalAttachedBytes,
    0
  );
  const sessionUsagePercent = Math.min(
    totalAttachedBytes / limits.maxSessionFileBytes,
    1
  );
  const stabilityNotice =
    typeof error === "string" &&
    error.startsWith("Imported as text to keep things stable.");
  const stabilityDetails = stabilityNotice
    ? error.replace("Imported as text to keep things stable.", "").trim()
    : "";

  const handleRestoreRequest = async () => {
    await restoreFromHandles(true);
  };

  runQueryRef.current = runQuery;

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] bg-[color:var(--color-bg)] text-[color:var(--text-primary)]">
      <WorkspaceTopBar
        title="Console"
        onOpenSchema={() => setShowSchemaDrawer(true)}
        statusLabel="Pro (Early Access)"
      />

      <div className="grid min-h-0 grid-cols-[320px_1fr] gap-0 overflow-hidden md:grid-cols-[320px_1fr]">
        <aside
          className="hidden h-full overflow-y-auto border-r border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 md:block"
          style={{ width: 320 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0B1220]">Tables</h2>
              <span className="text-xs text-[#5B6B82]">
                {schema.length} tables
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAttachClick}
                className="rounded-lg border border-[#003C79] bg-[#003C79] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors duration-150 hover:bg-[#002f60] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
              >
                {attachLabel}
              </button>
              <button
                type="button"
                onClick={handleDetachAll}
                disabled={attachedFiles.length === 0}
                className="rounded-lg border border-[#E6EEF7] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#003C79] transition-colors duration-150 hover:border-[#BCD3EC] hover:bg-[#F7FAFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79] disabled:opacity-50"
              >
                Detach all
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search tables"
            className="mt-4 w-full rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-xs text-[#0B1220] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
            value={schemaFilter}
            onChange={(event) => setSchemaFilter(event.target.value)}
            aria-label="Search tables"
          />
            <div className="mt-4 rounded-lg border border-[#E6EEF7] bg-white px-3 py-2 text-[11px] text-[#5B6B82]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                Memory estimate
              </p>
              <div className="mt-2 space-y-1 text-[11px] text-[#5B6B82]">
                <p>In use: {formatBytes(totalAttachedBytes)}</p>
                <p>Remaining: {formatBytes(sessionRemainingBytes)}</p>
              </div>
            <div className="mt-2 h-2 rounded-full bg-[#E6EEF7]">
              <div
                className="h-2 rounded-full bg-[#09CEA4]"
                style={{
                  width: `${Math.round(sessionUsagePercent * 100)}%`,
                }}
              />
            </div>
            {totalAttachedBytes >= limits.maxSessionFileBytes * 0.8 ? (
              <p className="mt-2 text-[10px] text-[#C95757]">
                Close to session budget.
              </p>
            ) : null}
          </div>
          <div className="mt-10 flex h-[calc(100vh-320px)] flex-col gap-4 overflow-y-auto pr-2 text-xs text-[#5B6B82]">
            {showRestoreBanner ? (
              <div className="rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-[11px] text-[#5B6B82]">
                <p className="text-[11px] font-semibold text-[#0B1220]">
                  Reconnect files
                </p>
                <p className="mt-1">
                  Your browser requires permission again after refresh. Click to
                  re-grant access to the same files.
                </p>
                <button
                  type="button"
                  onClick={handleRestoreRequest}
                  className="mt-2 rounded-md border border-[#E6EEF7] bg-white px-2 py-1 text-[11px] font-semibold text-[#003C79] transition-colors duration-150 hover:border-[#BCD3EC] hover:bg-[#F7FAFC]"
                >
                  Reconnect files
                </button>
              </div>
            ) : null}
            {showReattachBanner ? (
              <div className="rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-[11px] text-[#5B6B82]">
                <p className="text-[11px] font-semibold text-[#0B1220]">
                  Please re-attach files after refresh.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCsvImportModal(true)}
                  className="mt-2 rounded-md border border-[#E6EEF7] bg-white px-2 py-1 text-[11px] font-semibold text-[#003C79] transition-colors duration-150 hover:border-[#BCD3EC] hover:bg-[#F7FAFC]"
                >
                  {attachLabel}
                </button>
              </div>
            ) : null}
            {schema.length === 0 && missingAttachments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#E6EEF7] bg-[#F7FAFC] px-3 py-4 text-center text-xs text-[#5B6B82]">
                <p>Attach a {attachTypesLabel} file to get started.</p>
                <p className="mt-1 text-[11px] text-[#7A8AA1]">
                  You’ll query them with DuckDB SQL once attached.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCsvImportModal(true)}
                  className="mt-3 rounded-lg bg-[#003C79] px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#002f60] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                >
                  {attachLabel}
                </button>
              </div>
            ) : (
              <>
                {schema
                  .filter((table) =>
                    table.name.toLowerCase().includes(schemaFilter.toLowerCase())
                  )
                  .map((table) => {
                    const attachedEntry = attachedFilesByTable.get(table.name);
                    const isExpanded = expandedTables.has(table.name);
                    const isSelected = selectedTable === table.name;
                    const fileTypeLabel = attachedEntry?.fileType
                      ? attachedEntry.fileType.toUpperCase()
                      : null;
                    return (
                      <div
                        key={table.name}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleTable(table.name)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            toggleTable(table.name);
                          }
                        }}
                        className={`rounded-xl border p-3 ${
                          isSelected
                            ? "border-[#003C79] bg-[#EEF4FF]"
                            : isExpanded
                              ? "border-[#9ADBF1] bg-[#F2FAFF]"
                              : "border-[#E6EEF7] bg-[#F7FAFC]"
                        } transition hover:border-[#003C79]/60 hover:shadow-[0_10px_24px_rgba(11,18,32,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]`}
                      >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-3 px-2">
                          <div className="flex min-w-0 flex-col items-start">
                            <span
                              className="truncate text-sm font-semibold text-[#0B1220]"
                              title={table.name}
                            >
                              {table.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-[#5B6B82]">
                              <span>{table.columns.length} cols</span>
                              {fileTypeLabel ? (
                                <span className="rounded-full border border-[#E6EEF7] bg-white px-2 py-0.5 text-[10px] text-[#5B6B82]">
                                  {fileTypeLabel}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleProfileTable(table);
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[#3A6EA5] hover:border-[#D8E5F4] hover:bg-white hover:text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                            aria-label="Quick summary"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M4 19h16" />
                              <path d="M7 16V9" />
                              <path d="M12 16V5" />
                              <path d="M17 16v-3" />
                            </svg>
                          </button>
                          <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-[#0B1220] px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                            Quick summary
                          </span>
                        </div>
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCopyTableName(table.name);
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[#9AA9BE] hover:border-[#E6EEF7] hover:bg-white hover:text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                            aria-label="Copy table name"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="9" y="9" width="11" height="11" rx="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </button>
                          <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-[#0B1220] px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                            Copy table name
                          </span>
                        </div>
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRenameTable(table.name);
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[#9AA9BE] hover:border-[#E6EEF7] hover:bg-white hover:text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                            aria-label="Rename table"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                          <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-[#0B1220] px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                            Rename table
                          </span>
                        </div>
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteTable(table.name);
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[#C95757] hover:border-[#F7C7C7] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C95757]"
                            aria-label="Remove table"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M6 6l12 12" />
                              <path d="M18 6l-12 12" />
                            </svg>
                          </button>
                          <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-[#0B1220] px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                            Remove table
                          </span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <div className="mt-3 space-y-1">
                          {table.columns.map((column) => (
                            <button
                              key={`${table.name}-${column.name}`}
                              className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs text-[#5B6B82] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                              onClick={() =>
                                navigator.clipboard.writeText(column.name)
                              }
                              aria-label={`Copy column ${column.name}`}
                              title="Copy column name"
                            >
                              <span className="truncate">{column.name}</span>
                              <span className="rounded-full border border-[#E6EEF7] bg-white px-2 py-0.5 text-[10px] text-[#5B6B82]">
                                {column.type}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                      </div>
                    );
                  })}
                {missingAttachments
                  .filter((entry) =>
                    entry.tableName
                      .toLowerCase()
                      .includes(schemaFilter.toLowerCase())
                  )
                  .map((entry) => (
                    <div
                      key={`missing-${entry.tableName}`}
                      className="rounded-xl border border-dashed border-[#E6EEF7] bg-[#F7FAFC] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-col">
                          <span
                            className="truncate text-sm font-semibold text-[#0B1220]"
                            title={entry.tableName}
                          >
                            {entry.tableName}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-[#5B6B82]">
                            <span>Needs reattach</span>
                            <span className="rounded-full border border-[#E6EEF7] bg-white px-2 py-0.5 text-[10px] text-[#5B6B82]">
                              {entry.fileType.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleReattachSource(entry)}
                          className="shrink-0 rounded-lg border border-[#E6EEF7] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                        >
                          Reattach
                        </button>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </aside>
        <section className="flex min-h-0 min-w-0 flex-col gap-4 p-6">
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="shrink-0 rounded-2xl border border-[#E6EEF7] bg-white p-6 shadow-[0_18px_48px_rgba(11,18,32,0.08)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-[#0B1220]">
                    SQL Editor
                  </p>
                  <span
                    className="inline-flex items-center rounded-full border border-[#BFECE1] bg-[#EAFBF6] px-2 py-0.5 text-[11px] font-semibold text-[#0B6D58]"
                    title={SQL_DIALECT_TOOLTIP}
                  >
                    {SQL_DIALECT_LABEL}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden text-[11px] font-medium text-[#7A8AA1] md:inline">
                    Ctrl/Cmd + Enter
                  </span>
                  <button
                    type="button"
                    onClick={runQuery}
                    disabled={runDisabled || status === "Running"}
                    aria-disabled={runDisabled || status === "Running"}
                    title={
                      runDisabled
                        ? runDisabledReason ?? "Enter SQL to run"
                        : "Run SQL"
                    }
                    className={`inline-flex h-9 min-w-[96px] items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79] ${
                      runDisabled || status === "Running"
                        ? "border-[#E6EEF7] bg-white text-[#9AA9BE] opacity-60"
                        : "border-[#003C79] bg-[#003C79] text-white hover:bg-[#002f60] hover:shadow-[0_6px_18px_rgba(0,60,121,0.18)]"
                    }`}
                  >
                    {status === "Running" ? (
                      <span className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" />
                    ) : null}
                    {status === "Running" ? "Running…" : "Run"}
                  </button>
                  <button
                    className="h-9 rounded-lg border border-[#E6EEF7] bg-white px-3 text-xs font-semibold text-[#003C79] transition-colors duration-150 hover:border-[#BCD3EC] hover:bg-[#F7FAFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                    onClick={handleSaveClick}
                    disabled={!sql.trim()}
                  >
                    Save Query
                  </button>
                  <button
                    type="button"
                    className="h-9 rounded-lg border border-transparent px-3 text-xs font-semibold text-[#5B6B82] transition-colors duration-150 hover:border-[#E6EEF7] hover:bg-white hover:text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                    onClick={clearQuery}
                    aria-label="Clear editor"
                    title="Clear editor"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
                {queryTabs.map((tab) => {
                  const dirty = isTabDirty(tab);
                  const isActive = tab.id === activeTab?.id;
                  return (
                    <div
                      key={tab.id}
                      className={`group inline-flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        isActive
                          ? "bg-[#003C79] text-white"
                          : "bg-[#F7FAFC] text-[#5B6B82] hover:text-[#003C79]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveTabId(tab.id)}
                        onDoubleClick={() => handleRenameTab(tab.id, tab.name)}
                        className="flex min-w-0 items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                        title="Double-click to rename"
                      >
                        <span className="truncate">{tab.name}</span>
                        {dirty ? (
                          <span
                            className={`text-[10px] ${
                              isActive ? "text-white/80" : "text-[#9AA9BE]"
                            }`}
                            aria-label="Unsaved changes"
                          >
                            ●
                          </span>
                        ) : null}
                      </button>
                      <span
                        className={`h-4 w-px ${
                          isActive ? "bg-white/30" : "bg-[#E6EEF7]"
                        }`}
                        aria-hidden
                      />
                      <button
                        type="button"
                        className={`p-0.5 ${
                          isActive
                            ? "text-white/80 hover:text-white"
                            : "text-[#9AA9BE] hover:text-[#5B6B82]"
                        } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]`}
                        onClick={() => handleCloseTab(tab.id)}
                        aria-label="Close tab"
                        title="Close tab"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={handleNewTab}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E6EEF7] bg-white px-2.5 py-1 text-xs font-semibold text-[#003C79] transition-colors duration-150 hover:border-[#BCD3EC] hover:bg-[#F7FAFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                >
                  + New tab
                </button>
              </div>
              <div className="mt-4 h-[300px] min-h-[240px] overflow-hidden rounded-xl border border-[#E6EEF7] bg-[#F7FAFC]">
                <MonacoEditor
                  height="100%"
                  language="sql"
                  theme="vs-light"
                  value={sql}
                  onChange={(value) => updateActiveTab({ sql: value ?? "" })}
                  onMount={(editor, monacoInstance) => {
                    editorRef.current = editor;
                    editor.addCommand(
                      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
                      () => {
                        runQueryRef.current();
                      }
                    );
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                  }}
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E6EEF7] bg-white shadow-[0_18px_48px_rgba(11,18,32,0.08)]">
              <div className="shrink-0 flex items-center gap-4 border-b border-[#E6EEF7] px-6 py-4">
                <button
                  className={`text-sm font-semibold ${
                    activePanel === "results"
                      ? "text-[#003C79]"
                      : "text-[#5B6B82]"
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]`}
                  onClick={() => setActivePanel("results")}
                  aria-label="Results panel"
                >
                  Results
                </button>
                <button
                  className={`text-sm font-semibold ${
                    activePanel === "saved"
                      ? "text-[#003C79]"
                      : "text-[#5B6B82]"
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]`}
                  onClick={() => setActivePanel("saved")}
                  aria-label="Saved queries panel"
                >
                  Saved Queries (
                  {plan === "free"
                    ? `${savedQueries.length}/${limits.maxSavedQueries}`
                    : savedQueries.length}
                  )
                </button>
                <div className="hidden items-center gap-2 text-xs text-[#5B6B82] lg:flex">
                  {hasRun ? (
                    <span className={`${rowCountColor} tabular-nums`}>
                      Showing: {showingLabel}
                    </span>
                  ) : (
                    <span>No results yet</span>
                  )}
                  {runtimeLabel ? (
                    <>
                      <span className="text-[#E6EEF7]">•</span>
                      <span className="tabular-nums">Run: {runtimeLabel}</span>
                    </>
                  ) : null}
                  <span className="text-[#E6EEF7]">•</span>
                  <span className="tabular-nums">Export limit: {exportCapLabel}</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-[#E6EEF7] bg-white px-3 py-1.5 text-xs font-semibold text-[#003C79] transition-all duration-150 hover:border-[#BCD3EC] hover:bg-[#F7FAFC] hover:shadow-[0_6px_16px_rgba(11,18,32,0.06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79] disabled:opacity-50"
                    onClick={() => setShowExportModal(true)}
                    disabled={exportDisabled || exporting}
                    aria-disabled={exportDisabled || exporting}
                    title={
                      exportDisabled
                        ? "Run a query to export results"
                        : "Export results"
                    }
                  >
                    {exporting ? (
                      <span className="h-3 w-3 animate-spin rounded-full border border-[#003C79]/40 border-t-[#003C79]" />
                    ) : null}
                    {exporting ? "Exporting…" : "Export CSV"}
                  </button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-6 py-4">
                {error ? (
                  stabilityNotice ? (
                    <div className="rounded-xl border border-[#F4D9A6] bg-[#FFF7E6] px-4 py-3 text-xs text-[#7A5B12]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[#7A5B12]">
                            Imported as text to keep things stable
                          </p>
                          <p className="mt-1 text-xs text-[#8B6A22]">
                            This file is large, so we skipped automatic type
                            detection.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const tableRef = preferredTable
                                ? formatSqlIdentifier(preferredTable)
                                : "your_table";
                              insertSqlSnippet(
                                `SELECT\n  TRY_CAST(your_column AS INTEGER) AS your_column_int\nFROM ${tableRef}\nLIMIT ${limits.previewLimit};`
                              );
                            }}
                            className="rounded-lg border border-[#F4D9A6] bg-white px-2.5 py-1 text-xs font-semibold text-[#7A5B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A5B12]"
                          >
                            Insert type change example
                          </button>
                          <a
                            href="/docs#type-casting"
                            className="rounded-lg border border-[#F4D9A6] bg-white px-2.5 py-1 text-xs font-semibold text-[#7A5B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A5B12]"
                          >
                            Learn how to change column types
                          </a>
                        </div>
                      </div>
                      {stabilityDetails ? (
                        <details className="mt-2 text-[11px] text-[#8B6A22]">
                          <summary className="cursor-pointer text-[11px] text-[#8B6A22]">
                            Details
                          </summary>
                          <div className="mt-1">{stabilityDetails}</div>
                        </details>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-[#F7C56A] bg-[#FDF5E8] px-3 py-2 text-xs text-[#7A5B12]">
                      {error}
                    </div>
                  )
                ) : null}

                {previewApplied ? (
                  <div className="rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-xs text-[#5B6B82]">
                    Preview mode: showing first {limits.previewLimit} rows. Add
                    LIMIT or Export for more.
                  </div>
                ) : null}
                <div className="min-h-0 flex-1">
                  {activePanel === "results" ? (
                    resultColumns.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#E6EEF7] bg-[#F7FAFC] px-4 py-8 text-center text-xs text-[#5B6B82]">
                        {tableCount === 0 ? (
                          <>
                            <p>No tables yet. Attach a file to get started.</p>
                            <p className="text-[11px] text-[#7A8AA1]">
                              You’ll query them with DuckDB SQL once attached.
                            </p>
                            <button
                              type="button"
                              onClick={handleAttachClick}
                              className="rounded-lg bg-[#003C79] px-3 py-1.5 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                            >
                              {attachLabel}
                            </button>
                          </>
                        ) : (
                          <>
                            <p>No results yet. Run a query above to see results here.</p>
                            <p className="text-[11px] text-[#7A8AA1]">
                              Tip: You can attach more files if you need additional tables.
                            </p>
                            <button
                              type="button"
                              onClick={handleAttachClick}
                              className="rounded-lg bg-[#003C79] px-3 py-1.5 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                            >
                              {attachLabel}
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <ResultsTable
                        columns={resultColumns}
                        rows={pageRows}
                      />
                    )
                  ) : savedQueries.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#E6EEF7] bg-[#F7FAFC] px-4 py-8 text-center text-xs text-[#5B6B82]">
                      Save a query to reuse it later.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {plan === "free" ? (
                        <div className="text-xs text-[#5B6B82]">
                          {savedQueries.length}/{limits.maxSavedQueries} used
                        </div>
                      ) : null}
                      {savedQueries.map((query) => (
                        <div
                          key={query.id}
                          className="flex items-center justify-between rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3 text-xs"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#0B1220]">
                              {query.name}
                            </p>
                            <p className="mt-1 text-xs text-[#5B6B82]">
                              {query.sql.slice(0, 80)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="rounded-lg bg-[#003C79] px-3 py-1.5 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                              onClick={() => updateActiveTab({ sql: query.sql })}
                            >
                              Load
                            </button>
                            <button
                              className="rounded-lg border border-[#E6EEF7] px-3 py-1.5 text-xs font-semibold text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                              onClick={() =>
                                handleRenameSavedQuery(query.id, query.name)
                              }
                            >
                              Rename
                            </button>
                            <button
                              className="rounded-lg border border-[#E6EEF7] px-3 py-1.5 text-xs font-semibold text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                              onClick={() => handleDeleteSavedQuery(query.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-between border-t border-[#E6EEF7] px-6 py-3 text-xs text-[#5B6B82]">
                <span>
                  Page {pageIndex + 1} of {pageCount}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg border border-[#E6EEF7] px-2 py-1 text-xs font-semibold text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79] disabled:opacity-50"
                    onClick={() =>
                      updateActiveTabResult((current) =>
                        current
                          ? {
                              ...current,
                              pageIndex: Math.max(0, current.pageIndex - 1),
                            }
                          : current
                      )
                    }
                    disabled={pageIndex === 0}
                  >
                    Prev
                  </button>
                  <button
                    className="rounded-lg border border-[#E6EEF7] px-2 py-1 text-xs font-semibold text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79] disabled:opacity-50"
                    onClick={() =>
                      updateActiveTabResult((current) =>
                        current
                          ? {
                              ...current,
                              pageIndex: Math.min(pageCount - 1, current.pageIndex + 1),
                            }
                          : current
                      )
                    }
                    disabled={pageIndex >= pageCount - 1}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showSchemaDrawer ? (
        <div className="fixed inset-0 z-30 bg-[#0B1220]/40 md:hidden">
          <div className="absolute left-0 top-0 h-full w-[320px] bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#0B1220]">Tables</h2>
                <span className="text-xs text-[#5B6B82]">
                  {schema.length} tables
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSchemaDrawer(false)}
                className="rounded-lg border border-[#E6EEF7] px-2 py-1 text-xs font-semibold text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
              >
                Close
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAttachClick}
                  className="rounded-lg border border-[#003C79] bg-[#003C79] px-2.5 py-1 text-[11px] font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                >
                  {attachLabel}
                </button>
                <button
                  type="button"
                  onClick={handleDetachAll}
                  disabled={attachedFiles.length === 0}
                  className="rounded-lg border border-[#E6EEF7] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79] disabled:opacity-50"
                >
                  Detach all
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Search tables"
              className="mt-4 w-full rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-xs text-[#0B1220] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
              value={schemaFilter}
              onChange={(event) => setSchemaFilter(event.target.value)}
            />
            <div className="mt-4 rounded-lg border border-[#E6EEF7] bg-white px-3 py-2 text-[11px] text-[#5B6B82]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                Memory estimate
              </p>
              <div className="mt-2 space-y-1 text-[11px] text-[#5B6B82]">
                <p>In use: {formatBytes(totalAttachedBytes)}</p>
                <p>Remaining: {formatBytes(sessionRemainingBytes)}</p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#E6EEF7]">
                <div
                  className="h-2 rounded-full bg-[#09CEA4]"
                  style={{
                    width: `${Math.round(sessionUsagePercent * 100)}%`,
                  }}
                />
              </div>
              {totalAttachedBytes >= limits.maxSessionFileBytes * 0.8 ? (
                <p className="mt-2 text-[10px] text-[#C95757]">
                  Close to session budget.
                </p>
              ) : null}
            </div>
            <div className="mt-8 flex h-[calc(100vh-260px)] flex-col gap-4 overflow-y-auto pr-2 text-xs text-[#5B6B82]">
              {schema.length === 0 && missingAttachments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#E6EEF7] bg-[#F7FAFC] px-3 py-4 text-center text-xs text-[#5B6B82]">
                <p>Attach a {attachTypesLabel} file to get started.</p>
                  <button
                    type="button"
                    onClick={() => setShowCsvImportModal(true)}
                    className="mt-3 rounded-lg bg-[#003C79] px-3 py-1.5 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                  >
                    {attachLabel}
                  </button>
                </div>
              ) : (
                <>
                  {schema
                    .filter((table) =>
                      table.name
                        .toLowerCase()
                        .includes(schemaFilter.toLowerCase())
                    )
                    .map((table) => {
                      const isSelected = selectedTable === table.name;
                      return (
                        <button
                          type="button"
                          key={`drawer-${table.name}`}
                          onClick={() => setSelectedTable(table.name)}
                          className={`w-full rounded-xl border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79] ${
                            isSelected
                              ? "border-[#003C79] bg-[#EEF4FF]"
                              : "border-[#E6EEF7] bg-[#F7FAFC]"
                          }`}
                        >
                          <p className="text-sm font-semibold text-[#0B1220]">
                            {table.name}
                          </p>
                          <p className="text-[11px] text-[#5B6B82]">
                            {table.columns.length} columns
                          </p>
                        </button>
                      );
                    })}
                  {missingAttachments
                    .filter((entry) =>
                      entry.tableName
                        .toLowerCase()
                        .includes(schemaFilter.toLowerCase())
                    )
                    .map((entry) => (
                      <div
                        key={`drawer-missing-${entry.tableName}`}
                        className="rounded-xl border border-dashed border-[#E6EEF7] bg-[#F7FAFC] p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-col">
                            <span
                              className="truncate text-sm font-semibold text-[#0B1220]"
                              title={entry.tableName}
                            >
                              {entry.tableName}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-[#5B6B82]">
                              <span>Needs reattach</span>
                              <span className="rounded-full border border-[#E6EEF7] bg-white px-2 py-0.5 text-[10px] text-[#5B6B82]">
                                {entry.fileType.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleReattachSource(entry)}
                            className="shrink-0 rounded-lg border border-[#E6EEF7] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79]"
                          >
                            Reattach
                          </button>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <CsvImportModal
        open={showCsvImportModal}
        onClose={() => {
          setShowCsvImportModal(false);
          setImportProgress(null);
        }}
        workspaceId={consoleKey}
        sessionUsageBytes={totalAttachedBytes}
        sessionCapBytes={limits.maxSessionFileBytes}
        onImport={handleCsvImport}
        onBulkImport={handleBulkImport}
        allowParquet={supportsParquet}
        allowExcel={supportsExcel}
        importing={importing}
        progress={importProgress}
      />
      <SaveQueryModal
        open={showSaveModal}
        defaultName="New saved query"
        onCancel={() => setShowSaveModal(false)}
        onSave={handleSaveQuery}
      />
      <ExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        splitAvailable={limits.splitExportEnabled}
        exportLabel={exportPlan.label}
        exportCapLabel={limitText.exportRows}
        capped={exportPlan.capped}
        exportDisabled={exportRowCount === 0 || !sql.trim()}
        blockedReason={exportBlockedReason}
        splitBlockedReason={splitBlockedReason}
        rowsToExport={exportRowCount}
        splitRowsToExport={splitExportRowCount}
      />
      {pendingDeleteQuery ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1220]/40 px-6 py-10">
          <div className="w-full max-w-md rounded-2xl border border-[#E6EEF7] bg-white p-6 shadow-[0_18px_48px_rgba(11,18,32,0.18)]">
            <h2 className="text-lg font-semibold text-[#0B1220]">
              Delete saved query?
            </h2>
            <p className="mt-2 text-sm text-[#5B6B82]">
              {pendingDeleteQuery.name}
            </p>
            <p className="mt-2 text-xs text-[#5B6B82]">
              {pendingDeleteQuery.sql.slice(0, 120)}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteQuery(null)}
                className="rounded-lg border border-[#E6EEF7] bg-white px-4 py-2 text-sm font-semibold text-[#003C79]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSavedQuery}
                className="rounded-lg bg-[#C95757] px-4 py-2 text-sm font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <UpgradeModal
        open={showUpgradeModal}
        title={upgradeContent.title}
        description={upgradeContent.description}
        showUpgrade={upgradeContent.showUpgrade}
        bullets={upgradeContent.bullets}
        bulletsLabel={upgradeContent.bulletsLabel}
        onClose={() => setShowUpgradeModal(false)}
      />
      {copyToastMessage ? (
        <div className="fixed bottom-6 right-6 z-50">
          <Banner tone="success">
            {copyToastMessage}
          </Banner>
        </div>
      ) : null}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  }
  return `${Math.round(bytes / 1024)}KB`;
}

function formatRuntimeMs(runtimeMs: number) {
  if (runtimeMs < 1000) {
    return `${Math.round(runtimeMs)}ms`;
  }
  if (runtimeMs < 60_000) {
    return `${(runtimeMs / 1000).toFixed(2)}s`;
  }
  return `${(runtimeMs / 60_000).toFixed(2)}m`;
}

function buildTableProfileSql(table: SchemaTable) {
  const tableRef = formatSqlIdentifier(table.name);
  const selects: string[] = [];

  for (const column of table.columns) {
    const columnRef = formatSqlIdentifier(column.name);
    const columnName = toSqlStringLiteral(column.name);
    const dataType = toSqlStringLiteral(column.type);
    const isNumeric = isNumericProfileType(column.type);
    const isTemporal = isTemporalProfileType(column.type);
    const isCategorical = isCategoricalProfileType(column.type);
    const numericValueRef = `CAST(${columnRef} AS DOUBLE)`;
    const minExpr =
      isNumeric || isTemporal
        ? `COALESCE(CAST(MIN(${columnRef}) AS VARCHAR), '—')`
        : `'—'`;
    const maxExpr =
      isNumeric || isTemporal
        ? `COALESCE(CAST(MAX(${columnRef}) AS VARCHAR), '—')`
        : `'—'`;
    const meanExpr = isNumeric
      ? `COALESCE(CAST(ROUND(AVG(${numericValueRef}), 4) AS VARCHAR), '—')`
      : `'—'`;
    const stdExpr = isNumeric
      ? `COALESCE(CAST(ROUND(STDDEV_SAMP(${numericValueRef}), 4) AS VARCHAR), '—')`
      : `'—'`;
    const p25Expr = isNumeric
      ? `COALESCE(CAST(ROUND(QUANTILE_CONT(${numericValueRef}, 0.25), 4) AS VARCHAR), '—')`
      : `'—'`;
    const medianExpr = isNumeric
      ? `COALESCE(CAST(ROUND(QUANTILE_CONT(${numericValueRef}, 0.5), 4) AS VARCHAR), '—')`
      : `'—'`;
    const p75Expr = isNumeric
      ? `COALESCE(CAST(ROUND(QUANTILE_CONT(${numericValueRef}, 0.75), 4) AS VARCHAR), '—')`
      : `'—'`;
    const uniqueExpr = isCategorical
      ? `CAST(COUNT(DISTINCT ${columnRef}) AS VARCHAR)`
      : `'—'`;
    const topExpr = isCategorical
      ? `COALESCE((SELECT top_value FROM (SELECT COALESCE(NULLIF(TRIM(CAST(${columnRef} AS VARCHAR)), ''), '<empty>') AS top_value, COUNT(*) AS top_count FROM ${tableRef} WHERE ${columnRef} IS NOT NULL GROUP BY 1 ORDER BY top_count DESC LIMIT 1) fs_top), '—')`
      : `'—'`;
    const freqExpr = isCategorical
      ? `COALESCE((SELECT CAST(top_count AS VARCHAR) FROM (SELECT COALESCE(NULLIF(TRIM(CAST(${columnRef} AS VARCHAR)), ''), '<empty>') AS top_value, COUNT(*) AS top_count FROM ${tableRef} WHERE ${columnRef} IS NOT NULL GROUP BY 1 ORDER BY top_count DESC LIMIT 1) fs_top), '—')`
      : `'—'`;

    selects.push(`
SELECT
  ${columnName} AS column_name,
  ${dataType} AS data_type,
  COUNT(${columnRef}) AS count,
  COUNT(*) - COUNT(${columnRef}) AS nulls,
  CASE
    WHEN COUNT(*) = 0 THEN '0.00%'
    ELSE CAST(ROUND(((COUNT(*) - COUNT(${columnRef})) * 100.0) / COUNT(*), 2) AS VARCHAR) || '%'
  END AS null_pct,
  ${uniqueExpr} AS unique_values,
  ${topExpr} AS top,
  ${freqExpr} AS freq,
  ${meanExpr} AS mean,
  ${stdExpr} AS std,
  ${minExpr} AS min_value,
  ${p25Expr} AS p25,
  ${medianExpr} AS median,
  ${p75Expr} AS p75,
  ${maxExpr} AS max_value,
  CASE
    WHEN ${isNumeric ? "TRUE" : "FALSE"} THEN 'numeric'
    WHEN ${isTemporal ? "TRUE" : "FALSE"} THEN 'temporal'
    WHEN ${isCategorical ? "TRUE" : "FALSE"} THEN 'object'
    ELSE 'other'
  END AS profile_kind
FROM ${tableRef}`.trim());
  }

  return `${selects.join("\nUNION ALL\n")}\nORDER BY column_name;`;
}

function isNumericProfileType(type: string) {
  const normalized = type.trim().toUpperCase();
  return [
    "TINYINT",
    "SMALLINT",
    "INTEGER",
    "BIGINT",
    "UTINYINT",
    "USMALLINT",
    "UINTEGER",
    "UBIGINT",
    "HUGEINT",
    "UHUGEINT",
    "FLOAT",
    "DOUBLE",
    "REAL",
    "DECIMAL",
    "NUMERIC",
  ].some((token) => normalized === token || normalized.startsWith(`${token}(`));
}

function isTemporalProfileType(type: string) {
  const normalized = type.trim().toUpperCase();
  return (
    normalized === "DATE" ||
    normalized.startsWith("TIMESTAMP") ||
    normalized === "TIME"
  );
}

function isCategoricalProfileType(type: string) {
  const normalized = type.trim().toUpperCase();
  return (
    normalized === "BOOLEAN" ||
    normalized === "BOOL" ||
    normalized.includes("CHAR") ||
    normalized.includes("TEXT") ||
    normalized === "UUID" ||
    normalized === "VARCHAR"
  );
}

function getFriendlyErrorMessage(
  err: unknown,
  context?: { sessionUsageBytes?: number; sessionCapBytes?: number }
) {
  const message = err instanceof Error ? err.message : String(err);
  if (
    /malloc|out of memory|allocation failure|memory limit|wasm memory/i.test(
      message
    )
  ) {
    const usage =
      context?.sessionUsageBytes !== undefined &&
      context?.sessionCapBytes !== undefined
        ? ` Session usage ${formatBytes(
            context.sessionUsageBytes
          )} / ${formatBytes(context.sessionCapBytes)}.`
        : "";
    return `Memory limit reached. Try splitting files, detaching other tables, or changing column types in SQL.${usage}`;
  }
  return message;
}

function coerceCsvDelimiter(value: string | null | undefined): CsvDelimiter {
  const allowed: CsvDelimiter[] = ["auto", ",", ";", "\t", "|"];
  if (value && allowed.includes(value as CsvDelimiter)) {
    return value as CsvDelimiter;
  }
  return "auto";
}

function toSqlStringLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function applyAutoLimit(
  sql: string,
  autoLimit: boolean,
  previewLimit: number
) {
  if (!autoLimit) {
    return { sql, previewed: false };
  }
  const trimmed = sql.trim();
  if (!trimmed) {
    return { sql, previewed: false };
  }
  const sanitized = trimmed.replace(/;+\\s*$/, "");
  const isSelect = /^(select|with)\\b/i.test(trimmed);
  const hasLimit = /\\blimit\\b/i.test(trimmed);
  if (isSelect && !hasLimit) {
    return {
      sql: `SELECT * FROM (${sanitized}) AS fs_preview LIMIT ${previewLimit}`,
      previewed: true,
    };
  }
  return { sql, previewed: false };
}

function getRowCountColor(count: number) {
  if (count <= 5000) {
    return "text-[#09CEA4]";
  }
  if (count <= 50000) {
    return "text-[#C9A227]";
  }
  if (count <= 250000) {
    return "text-[#D47B2F]";
  }
  return "text-[#C95757]";
}

function getExportPlan(sql: string, exportCap: number) {
  const sqlLimit = getSqlLimit(sql);
  if (Number.isFinite(exportCap)) {
    const limit =
      sqlLimit !== null ? Math.min(sqlLimit, exportCap) : exportCap;
    const capped = sqlLimit === null || sqlLimit > exportCap;
    const label = `${limit.toLocaleString()}${capped ? " (capped)" : ""}`;
    return { limit, label, capped };
  }
  if (sqlLimit !== null) {
    return { limit: sqlLimit, label: sqlLimit.toLocaleString(), capped: false };
  }
  return { limit: null, label: "Full result", capped: false };
}

function getSqlLimit(sql: string) {
  const match = sql.match(/\blimit\s+(\d+)/i);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}


function getExportBlockedReason(rowCount: number, exportCap: number) {
  if (rowCount <= 0) {
    return null;
  }
  if (Number.isFinite(exportCap) && rowCount > exportCap) {
    return "This result is too large to export in the browser. Add filters, export smaller subsets, or reduce columns.";
  }
  return null;
}
async function exportSplitFiles(
  workspaceId: string,
  sql: string,
  options: { format: "csv"; rowsPerFile: number },
  duckdb: DuckDBClient,
  exportCap: number
) {
  const totalRows = await duckdb.countRows(workspaceId, sql);
  const blockedReason = getExportBlockedReason(totalRows, exportCap);
  if (blockedReason) {
    throw new Error(blockedReason);
  }
  const chunkSize = Math.max(1000, options.rowsPerFile);
  const totalChunks = Math.ceil(totalRows / chunkSize);

  for (let index = 0; index < totalChunks; index += 1) {
    const offset = index * chunkSize;
    const chunkSql = `SELECT * FROM (${sql}) AS fs_export LIMIT ${chunkSize} OFFSET ${offset}`;
    const buffer = await duckdb.exportQuery(
      workspaceId,
      chunkSql,
      options.format,
      `filesql-export-part-${index + 1}`
    );
    downloadBuffer(
      buffer,
      `filesql-export-part-${index + 1}.${options.format}`
    );
  }
}

function downloadBuffer(buffer: Uint8Array, filename: string) {
  const slice = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([slice]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
