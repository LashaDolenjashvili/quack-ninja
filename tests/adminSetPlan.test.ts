import assert from "node:assert/strict";
import { test } from "node:test";
import { POST } from "../app/api/admin/set-plan/route";

test("admin set-plan rejects missing auth header", async () => {
  const request = new Request("http://localhost/api/admin/set-plan", {
    method: "POST",
    body: JSON.stringify({ user_id: "user-id", plan: "pro" }),
  });
  const response = await POST(request);
  assert.equal(response.status, 401);
});
