type TableMeta = {
  name: string;
  columns: { name: string; type: string }[];
};

export type AttachedFileMeta = {
  tableName: string;
  fileName: string;
  fileType: "csv" | "xlsx" | "parquet";
  sheetName?: string | null;
  range?: string | null;
  headerRow?: boolean;
  headerRowIndex?: number | null;
  inferredTypes?: boolean;
  csvDelimiter?: string | null;
  csvHeader?: boolean;
  columnOverrides?: string[] | null;
  fileSize: number;
  createdAt: number;
  hasHandle?: boolean;
};

type ConsoleRuntime = {
  consoleId: string;
  tables: TableMeta[];
  lastOpenedAt: number;
  lastQueryPreview?: {
    rows: number;
    runtimeMs: number;
  };
  draftSql?: string;
  attachedFiles?: AttachedFileMeta[];
  importedTables?: AttachedFileMeta[];
};

const runtimeCache = new Map<string, ConsoleRuntime>();
const storageKey = "filesql-console-cache";
let hydrated = false;
const runtimeEvent = "filesql-runtime-changed";

function normalizeRuntime(entry: ConsoleRuntime) {
  if (!entry.attachedFiles && entry.importedTables) {
    entry.attachedFiles = entry.importedTables;
  }
  return {
    ...entry,
    tables: entry.tables ?? [],
    attachedFiles: entry.attachedFiles ?? [],
  };
}

function serializeRuntime(entry: ConsoleRuntime) {
  return {
    consoleId: entry.consoleId,
    lastOpenedAt: entry.lastOpenedAt,
    lastQueryPreview: entry.lastQueryPreview,
    draftSql: entry.draftSql,
  };
}

function hydrateFromSession() {
  if (hydrated || typeof window === "undefined") {
    return;
  }
  hydrated = true;
  const raw = window.sessionStorage.getItem(storageKey);
  if (!raw) {
    return;
  }
  try {
    const data = JSON.parse(raw) as ConsoleRuntime[];
    data.forEach((entry) =>
      runtimeCache.set(entry.consoleId, normalizeRuntime(entry))
    );
  } catch {
    window.sessionStorage.removeItem(storageKey);
  }
}

function persistToSession() {
  if (typeof window === "undefined") {
    return;
  }
  const values = Array.from(runtimeCache.values()).map(serializeRuntime);
  window.sessionStorage.setItem(storageKey, JSON.stringify(values));
  window.dispatchEvent(new Event(runtimeEvent));
}

export function getConsoleRuntime(consoleId: string) {
  hydrateFromSession();
  return runtimeCache.get(consoleId) ?? null;
}

export function setConsoleRuntime(consoleId: string, data: Partial<ConsoleRuntime>) {
  hydrateFromSession();
  const existing = runtimeCache.get(consoleId);
  const next: ConsoleRuntime = {
    consoleId,
    tables: existing?.tables ?? [],
    lastQueryPreview: existing?.lastQueryPreview,
    draftSql: existing?.draftSql,
    attachedFiles: existing?.attachedFiles ?? existing?.importedTables ?? [],
    ...data,
    lastOpenedAt: data.lastOpenedAt ?? existing?.lastOpenedAt ?? Date.now(),
  };
  runtimeCache.set(consoleId, normalizeRuntime(next));
  persistToSession();
  return next;
}

export function updateConsoleTables(
  consoleId: string,
  tables: TableMeta[]
) {
  return setConsoleRuntime(consoleId, { tables });
}

export function updateConsoleQueryPreview(
  consoleId: string,
  rows: number,
  runtimeMs: number
) {
  return setConsoleRuntime(consoleId, {
    lastQueryPreview: { rows, runtimeMs },
  });
}

export function setConsoleDraftSql(consoleId: string, sql: string) {
  return setConsoleRuntime(consoleId, { draftSql: sql });
}

export function setConsoleAttachedFiles(
  consoleId: string,
  files: AttachedFileMeta[]
) {
  return setConsoleRuntime(consoleId, { attachedFiles: files });
}

export function addConsoleAttachedFile(
  consoleId: string,
  table: AttachedFileMeta
) {
  const current = getConsoleRuntime(consoleId);
  const next = [...(current?.attachedFiles ?? []), table];
  return setConsoleRuntime(consoleId, { attachedFiles: next });
}

export function getConsoleTotalBytes(consoleId: string) {
  const current = getConsoleRuntime(consoleId);
  return (current?.attachedFiles ?? []).reduce(
    (sum, entry) => sum + (entry.fileSize ?? 0),
    0
  );
}

export function listConsoleRuntimes() {
  hydrateFromSession();
  return Array.from(runtimeCache.values());
}

export function getRuntimeEventName() {
  return runtimeEvent;
}
