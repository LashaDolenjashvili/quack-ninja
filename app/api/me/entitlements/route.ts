import { NextResponse } from "next/server";
import type { BillingRole } from "@/src/billing/types";
import { getSupabaseAdmin, supabaseAdminConfigured } from "@/src/lib/supabaseServer";
import { resolveEntitlements } from "@/src/billing/entitlements";
import { getEntitlements } from "@/src/lib/entitlements";
import { TRIAL_ENABLED_SERVER, TRIAL_DAYS, getTrialWindow } from "@/src/lib/trial";
import { BILLING_COMING_SOON } from "@/src/config/plans";

type OwnerSubscriptionRow = {
  provider: "paddle" | "manual";
  status: "active" | "inactive" | "past_due" | "canceled";
  current_period_end: string | null;
  created_at: string;
};

type EntitlementSubscription = {
  status: "active" | "inactive" | "past_due" | "canceled";
  current_period_end: string | null;
};

function inAccessWindow(currentPeriodEnd: string | null) {
  return !currentPeriodEnd || new Date(currentPeriodEnd).getTime() > Date.now();
}

function rankOwnerSubscription(subscription: OwnerSubscriptionRow) {
  const accessible = inAccessWindow(subscription.current_period_end);
  if (subscription.provider === "paddle" && subscription.status === "active" && accessible) {
    return 300;
  }
  if (subscription.provider === "manual" && subscription.status === "active" && accessible) {
    return 250;
  }
  if (subscription.status === "active" && accessible) {
    return 200;
  }
  return 0;
}

function pickBestOwnerSubscription(rows: OwnerSubscriptionRow[]) {
  return [...rows]
    .filter((row) => rankOwnerSubscription(row) >= 200)
    .sort((a, b) => {
    const rankDiff = rankOwnerSubscription(b) - rankOwnerSubscription(a);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })[0] ?? null;
}

export async function GET(request: Request) {
  const now = new Date();
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token || !supabaseAdminConfigured) {
    const limits = getEntitlements("free");
    return NextResponse.json({
      plan: "free",
      effective_plan: "free",
      limits,
      billing_role: "none",
      is_trial_active: false,
      trial_started_at: null,
      trial_ends_at: null,
      trial_consumed: false,
      trial_has_ended: false,
      trial_enabled: TRIAL_ENABLED_SERVER,
      trial_days: TRIAL_DAYS,
      server_now: now.toISOString(),
    });
  }

  const supabase = getSupabaseAdmin();
  const { data: authData, error: authError } = await supabase.auth.getUser(
    token
  );

  if (authError || !authData.user) {
    const limits = getEntitlements("free");
    return NextResponse.json({
      plan: "free",
      effective_plan: "free",
      limits,
      billing_role: "none",
      is_trial_active: false,
      trial_started_at: null,
      trial_ends_at: null,
      trial_consumed: false,
      trial_has_ended: false,
      trial_enabled: TRIAL_ENABLED_SERVER,
      trial_days: TRIAL_DAYS,
      server_now: now.toISOString(),
    });
  }

  const { data: config } = await supabase
    .from("app_config")
    .select("trial_enabled")
    .eq("id", 1)
    .maybeSingle();
  const trialEnabled = BILLING_COMING_SOON
    ? false
    : config?.trial_enabled ?? TRIAL_ENABLED_SERVER;

  let { data: profile } = await supabase
    .from("profiles")
    .select("id, email, plan, is_admin, billing_role, trial_started_at, trial_ends_at, trial_consumed")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!profile) {
    const insert = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: authData.user.email ?? null,
        plan: "free",
        billing_role: "none",
        trial_consumed: false,
      })
      .select("id, email, plan, is_admin, billing_role, trial_started_at, trial_ends_at, trial_consumed")
      .maybeSingle();
    profile = insert.data ?? null;
  }

  if (
    trialEnabled &&
    profile &&
    !profile.trial_consumed &&
    !profile.trial_started_at &&
    !profile.trial_ends_at
  ) {
    const { startedAt, endsAt } = getTrialWindow(now);
    const updated = await supabase
      .from("profiles")
      .update({
        trial_started_at: startedAt,
        trial_ends_at: endsAt,
        trial_consumed: true,
      })
      .eq("id", authData.user.id)
      .select("id, email, plan, is_admin, billing_role, trial_started_at, trial_ends_at, trial_consumed")
      .maybeSingle();
    profile = updated.data ?? profile;
  }

  let subscriptionRole: BillingRole = "none";
  const { data: ownerSubscriptions } = await supabase
    .from("subscriptions")
    .select("provider, status, current_period_end, created_at")
    .eq("owner_user_id", authData.user.id)
    .returns<OwnerSubscriptionRow[]>();

  let subscription: EntitlementSubscription | null =
    pickBestOwnerSubscription(ownerSubscriptions ?? []);

  if (subscription) {
    subscriptionRole = "owner";
  } else {
    const { data: memberSubscription } = await supabase
      .from("subscription_members")
      .select("subscriptions!inner(status, current_period_end)")
      .eq("member_user_id", authData.user.id)
      .limit(1)
      .maybeSingle<{
        subscriptions: {
          status: "active" | "inactive" | "past_due" | "canceled";
          current_period_end: string | null;
        };
      }>();
    if (
      memberSubscription?.subscriptions &&
      memberSubscription.subscriptions.status === "active" &&
      inAccessWindow(memberSubscription.subscriptions.current_period_end)
    ) {
      subscription = memberSubscription.subscriptions;
      subscriptionRole = "member";
    }
  }

  const entitlements = resolveEntitlements({
    profile: profile ?? null,
    subscription: subscription ?? null,
    now,
    trialEnabled,
  });

  return NextResponse.json({
    ...entitlements,
    billing_role: subscriptionRole,
  });
}
