import test from "node:test";
import assert from "node:assert/strict";
import { getTrialDaysRemaining, TRIAL_DAYS } from "../src/lib/trial";

test("getTrialDaysRemaining returns 7 on fresh trial", () => {
  const now = Date.now();
  const endsAt = new Date(now + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(getTrialDaysRemaining(now, endsAt), 7);
});

test("getTrialDaysRemaining rounds up partial days", () => {
  const now = Date.now();
  const endsAt = new Date(now + 6.1 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(getTrialDaysRemaining(now, endsAt), 7);
});

test("getTrialDaysRemaining returns 1 for small remaining time", () => {
  const now = Date.now();
  const endsAt = new Date(now + 0.1 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(getTrialDaysRemaining(now, endsAt), 1);
});

test("getTrialDaysRemaining returns 0 after expiry", () => {
  const now = Date.now();
  const endsAt = new Date(now - 1000).toISOString();
  assert.equal(getTrialDaysRemaining(now, endsAt), 0);
});

test("getTrialDaysRemaining clamps to trial length", () => {
  const now = Date.now();
  const endsAt = new Date(now + 40 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(getTrialDaysRemaining(now, endsAt), 7);
});
