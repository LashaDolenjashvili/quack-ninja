import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canAttachFile,
  canAttachTotal,
  canSaveQuery,
  getLimits,
} from "../src/lib/plans";

test("free plan limits gate correctly", () => {
  const limits = getLimits("free");
  assert.equal(canSaveQuery(2, limits), true);
  assert.equal(canSaveQuery(3, limits), false);
  assert.equal(canAttachFile(limits.maxFileBytes, limits), true);
  assert.equal(canAttachFile(limits.maxFileBytes + 1, limits), false);
  assert.equal(canAttachTotal(limits.maxTotalFileBytes, limits), true);
  assert.equal(
    canAttachTotal(limits.maxTotalFileBytes + 1, limits),
    false
  );
});
