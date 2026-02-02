"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getConsoleRuntime,
  type AttachedFileMeta,
} from "@/src/duckdb/runtimeCache";
import { getDuckDBClient } from "@/src/duckdb/duckdbSingleton";
import { getSavedQueriesEventName, listSavedQueries } from "@/src/db/indexeddb";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import {
  loadSessionSnapshot,
  saveSessionSnapshot,
  type QueryTabSnapshot,
} from "@/src/session/persistence";
import {
  listAttachedSources,
  listFileHandles,
  replaceAttachedSources,
  type AttachedSourceEntry,
} from "@/src/db/indexeddb";

type ConsoleSessionContextValue = {
  consoleId: string;
  tables: { name: string; columns: { name: string; type: string }[] }[];
  setTables: (
    tables: { name: string; columns: { name: string; type: string }[] }[]
  ) => void;
  importedTables: {
    tableName: string;
    fileName: string;
    fileType: "csv" | "xlsx" | "parquet";
    sheetName?: string | null;
    range?: string | null;
    headerRow?: boolean;
    inferredTypes?: boolean;
    fileSize: number;
    createdAt: number;
  }[];
  setImportedTables: (
    tables: {
      tableName: string;
      fileName: string;
    fileType: "csv" | "xlsx" | "parquet";
      sheetName?: string | null;
      range?: string | null;
      headerRow?: boolean;
      inferredTypes?: boolean;
      fileSize: number;
      createdAt: number;
    }[]
  ) => void;
  attachedFiles: (AttachedFileMeta & { handle?: FileSystemFileHandle | null })[];
  setAttachedFiles: (
    files:
      | (AttachedFileMeta & { handle?: FileSystemFileHandle | null })[]
      | ((
          current: (AttachedFileMeta & {
            handle?: FileSystemFileHandle | null;
          })[]
        ) => (AttachedFileMeta & { handle?: FileSystemFileHandle | null })[])
  ) => void;
  totalAttachedBytes: number;
  queryTabs: QueryTabSnapshot[];
  setQueryTabs: (
    tabs:
      | QueryTabSnapshot[]
      | ((current: QueryTabSnapshot[]) => QueryTabSnapshot[])
  ) => void;
  activeTabId: string | null;
  setActiveTabId: (tabId: string | null) => void;
  lastQueryPreview: { rows: number; runtimeMs: number } | null;
  setLastQueryPreview: (preview: { rows: number; runtimeMs: number } | null) => void;
  savedQueries: { id: string; name: string; sql: string }[];
  refreshSavedQueries: () => Promise<void>;
  duckdbRegistrationState: {
    status: "idle" | "checking" | "needs-permission" | "restoring" | "ready" | "blocked";
    message?: string;
    hasHandles: boolean;
    hasNonHandleAttachments: boolean;
  };
  setDuckdbRegistrationState: (
    next: {
      status: "idle" | "checking" | "needs-permission" | "restoring" | "ready" | "blocked";
      message?: string;
      hasHandles: boolean;
      hasNonHandleAttachments: boolean;
    }
  ) => void;
  persistedAttachments: AttachedFileMeta[];
  setPersistedAttachments: (
    files:
      | AttachedFileMeta[]
      | ((current: AttachedFileMeta[]) => AttachedFileMeta[])
  ) => void;
  hydrationStatus: "booting" | "hydrated" | "error";
};

const ConsoleSessionContext = createContext<ConsoleSessionContextValue>({
  consoleId: "console",
  tables: [],
  setTables: () => undefined,
  importedTables: [],
  setImportedTables: () => undefined,
  attachedFiles: [],
  setAttachedFiles: () => undefined,
  totalAttachedBytes: 0,
  queryTabs: [],
  setQueryTabs: () => undefined,
  activeTabId: null,
  setActiveTabId: () => undefined,
  lastQueryPreview: null,
  setLastQueryPreview: () => undefined,
  savedQueries: [],
  refreshSavedQueries: async () => undefined,
  duckdbRegistrationState: {
    status: "idle",
    hasHandles: false,
    hasNonHandleAttachments: false,
  },
  setDuckdbRegistrationState: () => undefined,
  persistedAttachments: [],
  setPersistedAttachments: () => undefined,
  hydrationStatus: "booting",
});

function mapMetaToSource(
  meta: AttachedFileMeta,
  fileHandle?: FileSystemFileHandle | null
): Omit<AttachedSourceEntry, "id"> {
  return {
    tableName: meta.tableName,
    fileName: meta.fileName,
    sourceType: meta.fileType,
    fileHandle: fileHandle ?? null,
    options: {
      delimiter: meta.csvDelimiter ?? null,
      header: meta.csvHeader ?? true,
      sheetName: meta.sheetName ?? null,
      headerRow: meta.headerRow ?? undefined,
      range: meta.range ?? null,
    },
    inferredTypes: meta.inferredTypes ?? false,
    fileSize: meta.fileSize ?? null,
    attachedAt: meta.createdAt ?? Date.now(),
  };
}

function mapHandleToSource(
  entry: {
    tableName: string;
    fileName: string;
    fileType?: "csv" | "xlsx" | "parquet";
    sheetName?: string | null;
    range?: string | null;
    headerRow?: boolean;
    inferredTypes?: boolean;
    csvDelimiter?: string | null;
    csvHeader?: boolean;
    handle: FileSystemFileHandle;
  }
): Omit<AttachedSourceEntry, "id"> {
  return {
    tableName: entry.tableName,
    fileName: entry.fileName,
    sourceType: entry.fileType ?? "csv",
    fileHandle: entry.handle,
    options: {
      delimiter: entry.csvDelimiter ?? null,
      header: entry.csvHeader ?? true,
      sheetName: entry.sheetName ?? null,
      headerRow: entry.headerRow ?? undefined,
      range: entry.range ?? null,
    },
    inferredTypes: entry.inferredTypes ?? false,
    fileSize: null,
    attachedAt: Date.now(),
  };
}

export function ConsoleSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [consoleId, setConsoleId] = useState("console");
  const [tables, setTables] = useState<
    { name: string; columns: { name: string; type: string }[] }[]
  >([]);
  const [importedTables, setImportedTables] = useState<
    {
      tableName: string;
      fileName: string;
      fileType: "csv" | "xlsx" | "parquet";
      sheetName?: string | null;
      range?: string | null;
      headerRow?: boolean;
      inferredTypes?: boolean;
      fileSize: number;
      createdAt: number;
    }[]
  >([]);
  const [attachedFiles, setAttachedFilesState] = useState<
    (AttachedFileMeta & { handle?: FileSystemFileHandle | null })[]
  >([]);
  const [persistedAttachments, setPersistedAttachments] = useState<
    AttachedFileMeta[]
  >([]);
  const [queryTabs, setQueryTabsState] = useState<QueryTabSnapshot[]>([]);
  const [activeTabId, setActiveTabIdState] = useState<string | null>(null);
  const [hydrationStatus, setHydrationStatus] = useState<
    "booting" | "hydrated" | "error"
  >("booting");
  const attachedFilesDirtyRef = useRef(false);
  const queryTabsDirtyRef = useRef(false);
  const [savedQueries, setSavedQueries] = useState<
    { id: string; name: string; sql: string }[]
  >([]);
  const [duckdbRegistrationState, setDuckdbRegistrationState] = useState<{
    status: "idle" | "checking" | "needs-permission" | "restoring" | "ready" | "blocked";
    message?: string;
    hasHandles: boolean;
    hasNonHandleAttachments: boolean;
  }>({
    status: "idle",
    hasHandles: false,
    hasNonHandleAttachments: false,
  });
  const [lastQueryPreview, setLastQueryPreview] = useState<{
    rows: number;
    runtimeMs: number;
  } | null>(null);
  const totalAttachedBytes = useMemo(
    () =>
      attachedFiles.reduce((sum, entry) => sum + (entry.fileSize ?? 0), 0),
    [attachedFiles]
  );
  const setAttachedFiles = useCallback((
    files:
      | (AttachedFileMeta & { handle?: FileSystemFileHandle | null })[]
      | ((
          current: (AttachedFileMeta & {
            handle?: FileSystemFileHandle | null;
          })[]
        ) => (AttachedFileMeta & { handle?: FileSystemFileHandle | null })[])
  ) => {
    attachedFilesDirtyRef.current = true;
    setAttachedFilesState((current) =>
      typeof files === "function" ? files(current) : files
    );
  }, []);
  const setQueryTabs = useCallback((
    tabs:
      | QueryTabSnapshot[]
      | ((current: QueryTabSnapshot[]) => QueryTabSnapshot[])
  ) => {
    queryTabsDirtyRef.current = true;
    setQueryTabsState((current) =>
      typeof tabs === "function" ? tabs(current) : tabs
    );
  }, []);
  const setActiveTabId = useCallback((tabId: string | null) => {
    queryTabsDirtyRef.current = true;
    setActiveTabIdState(tabId);
  }, []);
  const refreshSavedQueries = useCallback(async () => {
    const data = await listSavedQueries();
    setSavedQueries(data);
  }, []);
  const value = useMemo(
    () => ({
      consoleId,
      tables,
      setTables,
      importedTables,
      setImportedTables,
      attachedFiles,
      setAttachedFiles,
      totalAttachedBytes,
      queryTabs,
      setQueryTabs,
      activeTabId,
      setActiveTabId,
      lastQueryPreview,
      setLastQueryPreview,
      savedQueries,
      refreshSavedQueries,
      duckdbRegistrationState,
      setDuckdbRegistrationState,
      persistedAttachments,
      setPersistedAttachments,
      hydrationStatus,
    }),
    [
      consoleId,
      tables,
      importedTables,
      attachedFiles,
      totalAttachedBytes,
      queryTabs,
      activeTabId,
      lastQueryPreview,
      savedQueries,
      refreshSavedQueries,
      duckdbRegistrationState,
      persistedAttachments,
      hydrationStatus,
      setAttachedFiles,
      setPersistedAttachments,
      setQueryTabs,
      setActiveTabId,
    ]
  );

  useEffect(() => {
    if (!supabaseConfigured) {
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) {
        return;
      }
      const userId = data.user?.id;
      setConsoleId(userId ? `console-${userId}` : "console");
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const runtime = getConsoleRuntime(consoleId);
    setTables([]);
    if (runtime?.importedTables) {
      setImportedTables(runtime.importedTables);
    }
    if (runtime?.lastQueryPreview) {
      setLastQueryPreview(runtime.lastQueryPreview);
    }
    getDuckDBClient();
    refreshSavedQueries();
    const eventName = getSavedQueriesEventName();
    const handler = () => {
      refreshSavedQueries();
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [consoleId, refreshSavedQueries]);

  useEffect(() => {
    let active = true;
    setHydrationStatus("booting");
    attachedFilesDirtyRef.current = false;
    queryTabsDirtyRef.current = false;
    const hydrate = async () => {
      try {
        const snapshot = await loadSessionSnapshot(consoleId);
        if (!active) {
          return;
        }
        const snapshotAttachments = snapshot?.attachedFiles ?? [];
        setPersistedAttachments(snapshotAttachments);
        let sources = await listAttachedSources(consoleId);
        if (sources.length === 0) {
          const legacyHandles = await listFileHandles(consoleId);
          if (legacyHandles.length) {
            const migrated = legacyHandles.map(mapHandleToSource);
            await replaceAttachedSources(migrated, consoleId);
            sources = await listAttachedSources(consoleId);
          }
        }
        if (snapshotAttachments.length === 0) {
          await replaceAttachedSources([], consoleId);
        } else {
          const sourceMap = new Map<string, AttachedSourceEntry>();
          for (const source of sources) {
            const key = `${source.tableName}::${source.fileName}::${source.sourceType}`;
            sourceMap.set(key, source);
          }
          const resolved = snapshotAttachments.map((meta) => {
            const key = `${meta.tableName}::${meta.fileName}::${meta.fileType}`;
            const match =
              sourceMap.get(key) ??
              sources.find((entry) => entry.tableName === meta.tableName) ??
              null;
            return mapMetaToSource(meta, match?.fileHandle ?? null);
          });
          await replaceAttachedSources(resolved, consoleId);
        }
        if (snapshot?.queryTabs?.length) {
          setQueryTabsState(snapshot.queryTabs);
          setActiveTabIdState(snapshot.activeTabId ?? snapshot.queryTabs[0]?.id ?? null);
        } else {
          const runtime = getConsoleRuntime(consoleId);
          const initialSql = runtime?.draftSql ?? "SELECT 1 AS ready;";
          const tabId = `tab-${Date.now()}`;
          const nextTabs: QueryTabSnapshot[] = [
            {
              id: tabId,
              name: "Query 1",
              sql: initialSql,
              lastRunSql: initialSql,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ];
          setQueryTabsState(nextTabs);
          setActiveTabIdState(tabId);
        }
        setHydrationStatus("hydrated");
      } catch {
        if (!active) {
          return;
        }
        setPersistedAttachments([]);
        const tabId = `tab-${Date.now()}`;
        const fallbackTabs: QueryTabSnapshot[] = [
          {
            id: tabId,
            name: "Query 1",
            sql: "SELECT 1 AS ready;",
            lastRunSql: "SELECT 1 AS ready;",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ];
        setQueryTabsState(fallbackTabs);
        setActiveTabIdState(tabId);
        setHydrationStatus("error");
      }
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, [consoleId]);

  useEffect(() => {
    if (hydrationStatus !== "hydrated") {
      return;
    }
    if (!attachedFilesDirtyRef.current && !queryTabsDirtyRef.current) {
      return;
    }
    const snapshots = attachedFiles.map((entry) => {
      const rest = { ...entry };
      delete (rest as { handle?: FileSystemFileHandle | null }).handle;
      return rest;
    });
    void saveSessionSnapshot(consoleId, {
      attachedFiles: snapshots,
      queryTabs,
      activeTabId,
    });
    attachedFilesDirtyRef.current = false;
    queryTabsDirtyRef.current = false;
  }, [attachedFiles, consoleId, hydrationStatus, queryTabs, activeTabId]);

  return (
    <ConsoleSessionContext.Provider value={value}>
      {children}
    </ConsoleSessionContext.Provider>
  );
}

export function useConsoleSession() {
  return useContext(ConsoleSessionContext);
}
