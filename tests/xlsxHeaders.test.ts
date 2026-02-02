import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildColumnsAndRows,
  dedupeColumnNames,
  sanitizeColumnName,
} from "../src/lib/tabular/headers";

test("buildColumnsAndRows respects header row index within range", () => {
  const rows = [
    ["ignore", "ignore"],
    ["Name", "Age"],
    ["Ada", 36],
  ];
  const { columns, dataRows } = buildColumnsAndRows(rows, {
    headerEnabled: true,
    headerRowIndex: 1,
    rangeStartRow: 0,
  });
  assert.equal(columns[0], "name");
  assert.equal(columns[1], "age");
  assert.equal(dataRows.length, 1);
  assert.equal(String(dataRows[0][0]), "Ada");
});

test("buildColumnsAndRows handles header row offset from range start", () => {
  const rows = [
    ["Row6", "Row6"],
    ["HeaderA", "HeaderB"],
    ["ValueA", "ValueB"],
  ];
  const { columns } = buildColumnsAndRows(rows, {
    headerEnabled: true,
    headerRowIndex: 6,
    rangeStartRow: 5,
  });
  assert.equal(columns[0], "headera");
  assert.equal(columns[1], "headerb");
});

test("sanitizeColumnName falls back and prefixes digits", () => {
  assert.equal(sanitizeColumnName("  ", "col_1"), "col_1");
  assert.equal(sanitizeColumnName("12-month", "col_1"), "_12_month");
});

test("dedupeColumnNames appends suffixes", () => {
  const names = dedupeColumnNames(["id", "id", "name", "id"]);
  assert.deepEqual(names, ["id", "id_2", "name", "id_3"]);
});
