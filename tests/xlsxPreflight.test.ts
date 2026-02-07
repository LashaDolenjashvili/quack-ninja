import assert from "node:assert/strict";
import { test } from "node:test";
import {
  XLSX_FAST_MODE_THRESHOLD_BYTES,
  XLSX_HARD_LIMIT_BYTES,
  XLSX_MAX_BYTES_BY_PLAN,
  getXlsxPreflight,
} from "../src/lib/xlsxImportConfig";

test("xlsx preflight blocks oversized files", () => {
  const result = getXlsxPreflight(XLSX_HARD_LIMIT_BYTES + 1, "pro");
  assert.equal(result.mode, "blocked");
});

test("xlsx preflight enables fast mode above threshold", () => {
  const result = getXlsxPreflight(XLSX_FAST_MODE_THRESHOLD_BYTES + 1, "pro");
  assert.equal(result.mode, "fast");
});

test("xlsx preflight keeps normal mode for small files", () => {
  const result = getXlsxPreflight(XLSX_MAX_BYTES_BY_PLAN.free - 1, "free");
  assert.equal(result.mode, "normal");
});

test("xlsx preflight blocks free plan over limit with upgrade hint", () => {
  const result = getXlsxPreflight(XLSX_FAST_MODE_THRESHOLD_BYTES + 1, "free");
  assert.equal(result.mode, "blocked");
  assert.equal(result.upgradeSuggested, true);
});
