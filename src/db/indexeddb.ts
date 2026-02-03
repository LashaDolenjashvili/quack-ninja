import { openDB, type DBSchema } from "idb";
import type { CsvImportOptions } from "@/src/duckdb/csv";

const CONSOLE_ID = "console";

export type SavedQuery = {
  id: string;
  workspaceId?: string | null;
  name: string;
  sql: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
};

export type FileHandleEntry = {
  id: string;
  workspaceId?: string | null;
  tableName: string;
  fileName: string;
  fileType?: "csv" | "xlsx" | "parquet";
  sheetName?: string | null;
  range?: string | null;
  headerRow?: boolean;
  headerRowIndex?: number | null;
  inferredTypes?: boolean;
  csvDelimiter?: string | null;
  csvHeader?: boolean;
  csvOptions?: CsvImportOptions | null;
  columnOverrides?: string[] | null;
  handle: FileSystemFileHandle;
};

export type AttachedSourceOptions = {
  delimiter?: string | null;
  header?: boolean;
  sheetName?: string | null;
  headerRow?: boolean;
  range?: string | null;
};

export type AttachedSourceEntry = {
  id: string;
  workspaceId?: string | null;
  tableName: string;
  fileName: string;
  sourceType: "csv" | "xlsx" | "parquet";
  fileHandle?: FileSystemFileHandle | null;
  options?: AttachedSourceOptions | null;
  inferredTypes?: boolean;
  fileSize?: number | null;
  attachedAt: number;
};

type FileSQLSchema = DBSchema & {
  savedQueries: {
    key: string;
    value: SavedQuery;
  };
  fileHandles: {
    key: string;
    value: FileHandleEntry;
  };
  attachedSources: {
    key: string;
    value: AttachedSourceEntry;
  };
};

const DB_NAME = "filesql";
const DB_VERSION = 5;
const savedQueriesEvent = "filesql-saved-queries-changed";

let dbPromise: ReturnType<typeof openDB<FileSQLSchema>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<FileSQLSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if ((db.objectStoreNames as DOMStringList).contains("workspaces")) {
          db.deleteObjectStore("workspaces" as "savedQueries");
        }

        if (!db.objectStoreNames.contains("savedQueries")) {
          db.createObjectStore("savedQueries", {
            keyPath: "id",
          });
        }

        if (!db.objectStoreNames.contains("fileHandles")) {
          db.createObjectStore("fileHandles", {
            keyPath: "id",
          });
        }

        if (!db.objectStoreNames.contains("attachedSources")) {
          db.createObjectStore("attachedSources", {
            keyPath: "id",
          });
        }

        if (
          oldVersion < 5 &&
          db.objectStoreNames.contains("fileHandles") &&
          db.objectStoreNames.contains("attachedSources") &&
          transaction
        ) {
          const fileHandles = transaction.objectStore("fileHandles");
          const attachedSources = transaction.objectStore("attachedSources");
          fileHandles.getAll().then((entries) => {
            entries.forEach((entry) => {
              const sourceType = entry.fileType ?? "csv";
              const options: AttachedSourceOptions = {
                delimiter: entry.csvDelimiter ?? entry.csvOptions?.delimiter ?? null,
                header: entry.csvHeader ?? entry.csvOptions?.header ?? true,
                sheetName: entry.sheetName ?? null,
                headerRow: entry.headerRow ?? undefined,
                range: entry.range ?? null,
              };
              const record: AttachedSourceEntry = {
                id: entry.id,
                workspaceId: entry.workspaceId,
                tableName: entry.tableName,
                fileName: entry.fileName,
                sourceType,
                fileHandle: entry.handle,
                options,
                inferredTypes: entry.inferredTypes ?? false,
                attachedAt: Date.now(),
              };
              attachedSources.put(record);
            });
          });
        }
      },
    });
  }
  return dbPromise;
}

function emitSavedQueriesEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(savedQueriesEvent));
  }
}

export function getSavedQueriesEventName() {
  return savedQueriesEvent;
}

export async function listSavedQueries() {
  const db = await getDb();
  const items = await db.getAll("savedQueries");
  return items.filter((item) => !item.deletedAt);
}

export async function createSavedQuery(
  name: string,
  sql: string
) {
  const db = await getDb();
  const now = Date.now();
  const savedQuery: SavedQuery = {
    id: crypto.randomUUID(),
    workspaceId: CONSOLE_ID,
    name,
    sql,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await db.put("savedQueries", savedQuery);
  emitSavedQueriesEvent();
  return savedQuery;
}

export async function deleteSavedQuery(id: string) {
  const db = await getDb();
  const current = await db.get("savedQueries", id);
  if (!current) {
    return;
  }
  await db.put("savedQueries", {
    ...current,
    deletedAt: Date.now(),
  });
  emitSavedQueriesEvent();
}

export async function renameSavedQuery(id: string, name: string) {
  const db = await getDb();
  const current = await db.get("savedQueries", id);
  if (!current) {
    return;
  }
  await db.put("savedQueries", {
    ...current,
    name,
    updatedAt: Date.now(),
  });
  emitSavedQueriesEvent();
}

export async function saveFileHandle(
  entry: Omit<FileHandleEntry, "id">,
  workspaceId = CONSOLE_ID
) {
  const db = await getDb();
  const record: FileHandleEntry = {
    id: crypto.randomUUID(),
    workspaceId,
    ...entry,
  };
  await db.put("fileHandles", record);
  return record;
}

export async function replaceFileHandles(
  entries: Omit<FileHandleEntry, "id">[],
  workspaceId = CONSOLE_ID
) {
  const db = await getDb();
  const tx = db.transaction("fileHandles", "readwrite");
  const existing = await tx.store.getAll();
  for (const entry of existing) {
    if (entry.workspaceId === workspaceId) {
      await tx.store.delete(entry.id);
    }
  }
  for (const entry of entries) {
    const record: FileHandleEntry = {
      id: crypto.randomUUID(),
      workspaceId,
      ...entry,
    };
    await tx.store.put(record);
  }
  await tx.done;
}

export async function listFileHandles(workspaceId = CONSOLE_ID) {
  const db = await getDb();
  const entries = await db.getAll("fileHandles");
  return entries.filter((entry) => entry.workspaceId === workspaceId);
}

export async function replaceAttachedSources(
  entries: Omit<AttachedSourceEntry, "id">[],
  workspaceId = CONSOLE_ID
) {
  const db = await getDb();
  const tx = db.transaction("attachedSources", "readwrite");
  const existing = await tx.store.getAll();
  for (const entry of existing) {
    if (entry.workspaceId === workspaceId) {
      await tx.store.delete(entry.id);
    }
  }
  for (const entry of entries) {
    const record: AttachedSourceEntry = {
      id: crypto.randomUUID(),
      workspaceId,
      ...entry,
    };
    await tx.store.put(record);
  }
  await tx.done;
}

export async function listAttachedSources(workspaceId = CONSOLE_ID) {
  const db = await getDb();
  const entries = await db.getAll("attachedSources");
  return entries.filter((entry) => entry.workspaceId === workspaceId);
}

export async function deleteFileHandle(id: string) {
  const db = await getDb();
  await db.delete("fileHandles", id);
}
