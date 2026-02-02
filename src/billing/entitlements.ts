import { getEntitlements } from "@/src/lib/entitlements";
import { TRIAL_DAYS } from "@/src/config/plans";
import type { BillingProfile, Plan, SubscriptionStatus } from "@/src/billing/types";

export type SubscriptionSnapshot = {
  status: SubscriptionStatus;
  current_period_end: string | null;
} | null;

export type ResolvedEntitlements = {
  plan: Plan;
  effective_plan: Plan;
  limits: ReturnType<typeof getEntitlements>;
  is_trial_active: boolean;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_consumed: boolean;
  trial_has_ended: boolean;
  trial_enabled: boolean;
  trial_days: number;
  server_now: string;
};

export function resolveEntitlements({
  profile,
  subscription,
  now,
  trialEnabled,
}: {
  profile: (BillingProfile & {
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
    trial_consumed?: boolean | null;
  }) | null;
  subscription: SubscriptionSnapshot;
  now: Date;
  trialEnabled: boolean;
}): ResolvedEntitlements {
  const nowMs = now.getTime();
  const trialEndsAt = profile?.trial_ends_at ?? null;
  const trialStartedAt = profile?.trial_started_at ?? null;
  const trialConsumed = Boolean(profile?.trial_consumed);
  const trialActive = Boolean(
    trialEnabled && trialEndsAt && nowMs < new Date(trialEndsAt).getTime()
  );
  const trialHasEnded = Boolean(
    trialEnabled && trialEndsAt && nowMs >= new Date(trialEndsAt).getTime()
  );
  const hasActiveSub = Boolean(
    subscription &&
      subscription.status === "active" &&
      (!subscription.current_period_end ||
        new Date(subscription.current_period_end).getTime() > nowMs)
  );

  const profilePlan: Plan = profile?.plan === "pro" ? "pro" : "free";
  const effectivePlan: Plan =
    profilePlan === "pro" && (hasActiveSub || subscription === null)
      ? "pro"
      : trialActive
        ? "pro"
        : "free";

  return {
    plan: effectivePlan,
    effective_plan: effectivePlan,
    limits: getEntitlements(effectivePlan),
    is_trial_active: trialActive,
    trial_started_at: trialStartedAt,
    trial_ends_at: trialEndsAt,
    trial_consumed: trialConsumed,
    trial_has_ended: trialHasEnded,
    trial_enabled: trialEnabled,
    trial_days: TRIAL_DAYS,
    server_now: now.toISOString(),
  };
}
