import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getMeaningfulColumnCount,
  trimTrailingEmptyColumns,
} from "../src/lib/xlsxTable";

test("getMeaningfulColumnCount ignores trailing empty columns", () => {
  const rows = [
    ["id", "name", "", "", null],
    [1, "Ada", null, null, null],
    [2, "Linus"],
  ];
  assert.equal(getMeaningfulColumnCount(rows), 2);
});

test("trimTrailingEmptyColumns keeps populated far-right header", () => {
  const rows = [
    ["id", "name", "", "status"],
    [1, "Ada", null, "active"],
  ];
  const result = trimTrailingEmptyColumns(rows);
  assert.equal(result.columnCount, 4);
  assert.equal(result.rows[0].length, 4);
});

test("trimTrailingEmptyColumns collapses fully empty sheet", () => {
  const rows = [[null, "", "   "], [null]];
  const result = trimTrailingEmptyColumns(rows);
  assert.equal(result.columnCount, 0);
  assert.deepEqual(result.rows, []);
});
