import { DuckDBClient } from "@/src/duckdb/client";

let client: DuckDBClient | null = null;

export function getDuckDBClient() {
  if (!client) {
    client = new DuckDBClient();
  }
  return client;
}
