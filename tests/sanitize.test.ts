import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeFileName } from "../src/lib/sanitize";

test("sanitizeFileName removes unsafe characters", () => {
  const sanitized = sanitizeFileName("my file@name.csv");
  assert.equal(sanitized, "my_file_name.csv");
});

