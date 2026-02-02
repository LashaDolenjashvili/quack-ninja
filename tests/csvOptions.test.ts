import assert from "node:assert/strict";
import { test } from "node:test";
import { buildReadCsvAutoSql } from "../src/duckdb/csv";

test("buildReadCsvAutoSql includes header and delimiter options", () => {
  const sql = buildReadCsvAutoSql("data.csv", {
    header: true,
    delimiter: ";",
  });
  assert.ok(sql.includes("read_csv_auto('data.csv'"));
  assert.ok(sql.includes("header=true"));
  assert.ok(sql.includes("sample_size=20000"));
  assert.ok(sql.includes("delim=';'"));
  assert.ok(sql.includes("all_varchar=true"));
});

test("buildReadCsvAutoSql omits delimiter for auto", () => {
  const sql = buildReadCsvAutoSql("data.csv", {
    header: false,
    delimiter: "auto",
  });
  assert.ok(!sql.includes("delim="));
  assert.ok(sql.includes("header=false"));
  assert.ok(sql.includes("all_varchar=true"));
});
