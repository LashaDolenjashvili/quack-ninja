import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveEntitlements } from "../src/billing/entitlements";

const now = new Date("2026-02-01T12:00:00Z");

test("active trial returns pro entitlements", () => {
  const entitlements = resolveEntitlements({
    profile: {
      id: "user_1",
      email: "user@example.com",
      plan: "free",
      trial_started_at: "2026-02-01T12:00:00Z",
      trial_ends_at: "2026-02-08T12:00:00Z",
      trial_consumed: true,
    },
    subscription: null,
    now,
    trialEnabled: true,
  });

  assert.equal(entitlements.plan, "pro");
  assert.equal(entitlements.is_trial_active, true);
});

test("expired trial returns free entitlements", () => {
  const entitlements = resolveEntitlements({
    profile: {
      id: "user_1",
      email: "user@example.com",
      plan: "free",
      trial_started_at: "2026-01-01T12:00:00Z",
      trial_ends_at: "2026-01-08T12:00:00Z",
      trial_consumed: true,
    },
    subscription: null,
    now,
    trialEnabled: true,
  });

  assert.equal(entitlements.plan, "free");
  assert.equal(entitlements.is_trial_active, false);
  assert.equal(entitlements.trial_has_ended, true);
});

test("active subscription keeps pro", () => {
  const entitlements = resolveEntitlements({
    profile: {
      id: "user_1",
      email: "user@example.com",
      plan: "pro",
      trial_started_at: null,
      trial_ends_at: null,
      trial_consumed: false,
    },
    subscription: {
      status: "active",
      current_period_end: "2026-03-01T12:00:00Z",
    },
    now,
    trialEnabled: true,
  });

  assert.equal(entitlements.plan, "pro");
  assert.equal(entitlements.is_trial_active, false);
});

test("trial disabled does not activate", () => {
  const entitlements = resolveEntitlements({
    profile: {
      id: "user_1",
      email: "user@example.com",
      plan: "free",
      trial_started_at: "2026-02-01T12:00:00Z",
      trial_ends_at: "2026-02-08T12:00:00Z",
      trial_consumed: true,
    },
    subscription: null,
    now,
    trialEnabled: false,
  });

  assert.equal(entitlements.plan, "free");
  assert.equal(entitlements.is_trial_active, false);
});
