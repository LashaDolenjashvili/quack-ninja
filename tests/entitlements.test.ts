import assert from "node:assert/strict";
import { test } from "node:test";
import { getEntitlements } from "../src/lib/entitlements";

test("entitlements return expected caps", () => {
  const free = getEntitlements("free");
  const pro = getEntitlements("pro");

  assert.equal(free.maxFileBytes, 25 * 1024 * 1024);
  assert.equal(free.maxTotalFileBytes, 100 * 1024 * 1024);
  assert.equal(free.previewLimit, 1000);
  assert.equal(free.exportMaxRows, 1000);
  assert.equal(free.maxSavedQueries, 3);

  assert.equal(pro.maxFileBytes, 1 * 1024 * 1024 * 1024);
  assert.equal(pro.maxTotalFileBytes, 2 * 1024 * 1024 * 1024);
  assert.equal(pro.previewLimit, 10000);
  assert.equal(pro.exportMaxRows, 500000);
  assert.equal(pro.maxSavedQueries, Number.POSITIVE_INFINITY);
});
