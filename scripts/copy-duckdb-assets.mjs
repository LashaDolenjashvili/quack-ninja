import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "node_modules", "@duckdb", "duckdb-wasm", "dist");
const outDir = path.join(root, "public", "duckdb");

fs.mkdirSync(outDir, { recursive: true });

const candidates = [
  // EH (preferred)
  "duckdb-eh.wasm",
  "duckdb-browser-eh.worker.js",

  // MVP (fallback)
  "duckdb-mvp.wasm",
  "duckdb-browser-mvp.worker.js",

  // Some versions also ship these aliases; copy if present
  "duckdb.wasm",
  "duckdb-browser.worker.js",
];

let copied = 0;
for (const file of candidates) {
  const src = path.join(srcDir, file);
  const dst = path.join(outDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    copied++;
  }
}

if (copied === 0) {
  console.error("No DuckDB assets found to copy. Check @duckdb/duckdb-wasm is installed.");
  process.exit(1);
}

console.log(`DuckDB assets copied to ${outDir} (${copied} files)`);
