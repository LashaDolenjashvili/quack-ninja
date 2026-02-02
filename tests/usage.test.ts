import assert from "node:assert/strict";
import { test } from "node:test";
import { countActiveSavedQueries } from "../src/lib/usage";

test("countActiveSavedQueries excludes deleted queries", () => {
  const queries = [
    { deletedAt: null },
    { deletedAt: undefined },
    { deletedAt: Date.now() },
  ];
  assert.equal(countActiveSavedQueries(queries), 2);
});
