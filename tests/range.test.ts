import assert from "node:assert/strict";
import { test } from "node:test";
import { parseA1Range } from "../src/lib/range";

test("parseA1Range handles basic ranges", () => {
  const parsed = parseA1Range("A1:C3");
  assert.ok(parsed);
  assert.equal(parsed?.startRow, 0);
  assert.equal(parsed?.startCol, 0);
  assert.equal(parsed?.endRow, 2);
  assert.equal(parsed?.endCol, 2);
});

test("parseA1Range rejects invalid ranges", () => {
  assert.equal(parseA1Range("A0:B2"), null);
  assert.equal(parseA1Range(""), null);
});
