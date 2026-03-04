import { NextResponse } from "next/server";
import type { PaidPlanCode } from "@/src/billing/catalog";
import { isPaidPlanCode } from "@/src/billing/catalog";
import {
  createPaddleTransaction,
} from "@/src/billing/paddleServer";
import { getSupabaseAdmin, supabaseAdminConfigured } from "@/src/lib/supabaseServer";

type ChangePlanPayload = {
  target_plan_code: string;
  auto_renew: boolean;
};

type ActiveSubscriptionRow = {
  id: string;
  provider: "paddle" | "manual";
  provider_subscription_id: string | null;
  plan_code: PaidPlanCode;
  status: "active" | "inactive" | "past_due" | "canceled";
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  auto_renew: boolean;
};

function parsePayload(payload: unknown): ChangePlanPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const maybe = payload as {
    target_plan_code?: unknown;
    auto_renew?: unknown;
  };
  if (
    typeof maybe.target_plan_code !== "string" ||
    typeof maybe.auto_renew !== "boolean"
  ) {
    return null;
  }
  return {
    target_plan_code: maybe.target_plan_code,
    auto_renew: maybe.auto_renew,
  };
}

function isInAccessWindow(subscription: Pick<ActiveSubscriptionRow, "current_period_end">) {
  return (
    !subscription.current_period_end ||
    new Date(subscription.current_period_end).getTime() > Date.now()
  );
}

function pickCurrentOwnerSubscription(rows: ActiveSubscriptionRow[]) {
  return [...rows]
    .filter((row) => row.status === "active" && isInAccessWindow(row))
    .sort((a, b) => {
      const score = (row: ActiveSubscriptionRow) => {
        if (row.provider === "paddle" && row.status === "active" && isInAccessWindow(row)) {
          return 300;
        }
        if (row.provider === "manual" && row.status === "active") {
          return 200;
        }
        if (row.status === "active" && isInAccessWindow(row)) {
          return 150;
        }
        return 0;
      };
      const diff = score(b) - score(a);
      if (diff !== 0) {
        return diff;
      }
      return 0;
    })[0] ?? null;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!supabaseAdminConfigured) {
    return NextResponse.json(
      { error: "Server not configured for billing." },
      { status: 500 }
    );
  }

  const payload = parsePayload(await request.json().catch(() => null));
  if (!payload || !isPaidPlanCode(payload.target_plan_code)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  const targetPlanCode = payload.target_plan_code;

  const supabase = getSupabaseAdmin();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: ownerSubscriptions } = await supabase
    .from("subscriptions")
    .select(
      "id, provider, provider_subscription_id, plan_code, status, current_period_end, cancel_at_period_end, auto_renew"
    )
    .eq("owner_user_id", authData.user.id)
    .returns<ActiveSubscriptionRow[]>();

  const currentSubscription = pickCurrentOwnerSubscription(ownerSubscriptions ?? []);

  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_ends_at")
    .eq("id", authData.user.id)
    .maybeSingle<{ trial_ends_at: string | null }>();

  const trialEndsAt = profile?.trial_ends_at ?? null;
  const trialRemainingSeconds = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 1000))
    : 0;
  const trialActive = Boolean(trialEndsAt && trialRemainingSeconds > 0);

  const createTransaction = async () => {
      const transactionId = await createPaddleTransaction({
      userId: authData.user.id,
      email: authData.user.email ?? null,
      planCode: targetPlanCode,
      autoRenew: payload.auto_renew,
      trialEndsAt: trialActive ? trialEndsAt : null,
      trialRemainingSeconds,
    });
    return NextResponse.json({
      mode: "checkout",
      transaction_id: transactionId,
      message: trialActive
        ? "Trial remains visible in the app until it ends, but the paid subscription starts immediately after checkout."
        : "Checkout ready.",
    });
  };

  if (!currentSubscription || currentSubscription.provider !== "paddle") {
    return createTransaction();
  }

  const currentPlan = currentSubscription.plan_code;
  const targetPlan = targetPlanCode;

  if (currentPlan === targetPlan) {
    if (currentSubscription.status !== "active" || !isInAccessWindow(currentSubscription)) {
      return createTransaction();
    }

    return NextResponse.json(
      { error: "This plan is already your current active plan." },
      { status: 409 }
    );
  }

  const switchTransactionId = await createPaddleTransaction({
    userId: authData.user.id,
    email: authData.user.email ?? null,
    planCode: targetPlan,
    autoRenew: payload.auto_renew,
    trialEndsAt: trialActive ? trialEndsAt : null,
    trialRemainingSeconds,
  });

  return NextResponse.json({
    mode: "switch_required",
    transaction_id: switchTransactionId,
    message:
      `Switching from ${currentPlan.replace("_", " ")} to ${targetPlan.replace("_", " ")} requires canceling the current plan first.`,
  });
}
