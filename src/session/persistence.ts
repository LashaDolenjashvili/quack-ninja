import { openDB, type DBSchema } from "idb";
import type { AttachedFileMeta } from "@/src/duckdb/runtimeCache";

export type QueryTabSnapshot = {
  id: string;
  name: string;
  sql: string;
  lastRunSql?: string | null;
  createdAt: number;
  updatedAt: number;
};

type SessionSnapshot = {
  id: string;
  attachedFiles: AttachedFileMeta[];
  queryTabs?: QueryTabSnapshot[];
  activeTabId?: string | null;
  updatedAt: number;
};

type SessionSchema = DBSchema & {
  sessionSnapshots: {
    key: string;
    value: SessionSnapshot;
  };
};

const DB_NAME = "filesql-session";
const DB_VERSION = 1;

let dbPromise: ReturnType<typeof openDB<SessionSchema>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<SessionSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("sessionSnapshots")) {
          db.createObjectStore("sessionSnapshots", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function loadSessionSnapshot(id: string) {
  const db = await getDb();
  return (await db.get("sessionSnapshots", id)) ?? null;
}

export async function saveSessionSnapshot(
  id: string,
  payload: {
    attachedFiles: AttachedFileMeta[];
    queryTabs?: QueryTabSnapshot[];
    activeTabId?: string | null;
  }
) {
  const db = await getDb();
  const snapshot: SessionSnapshot = {
    id,
    attachedFiles: payload.attachedFiles,
    queryTabs: payload.queryTabs,
    activeTabId: payload.activeTabId ?? null,
    updatedAt: Date.now(),
  };
  await db.put("sessionSnapshots", snapshot);
}

export async function clearSessionSnapshot(id: string) {
  const db = await getDb();
  await db.delete("sessionSnapshots", id);
}
