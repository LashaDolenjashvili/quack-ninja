import assert from "node:assert/strict";
import { test } from "node:test";
import { detectTableRegion, type CellValue } from "../src/lib/tableDetection";

test("detects main table and ignores stray far-right cell", () => {
  const grid: CellValue[][] = [
    ["Name", "Age", "City", null, null, "Stray"],
    ["A", 30, "NY", null, null, null],
    ["B", 22, "LA", null, null, null],
  ];
  const detected = detectTableRegion(grid, { scanWindowCols: 6 });
  assert.ok(detected);
  assert.equal(detected?.colStart, 0);
  assert.equal(detected?.colEnd, 2);
  assert.equal(detected?.strayCellsCount, 1);
  assert.ok(detected?.strayCellExamples?.includes("F1"));
});

test("marks ambiguous when table is far from top-left", () => {
  const grid: CellValue[][] = Array.from({ length: 60 }, () => []);
  grid[55] = ["Header1", "Header2", "Header3"];
  grid[56] = ["A", "B", "C"];
  const detected = detectTableRegion(grid, { scanWindowRows: 60, scanWindowCols: 5 });
  assert.ok(detected);
  assert.equal(detected?.ambiguous, true);
});
