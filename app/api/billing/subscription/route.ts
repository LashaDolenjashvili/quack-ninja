import { NextResponse } from "next/server";
import { getSeatLimitForPlanCode, type PaidPlanCode } from "@/src/billing/catalog";
import type { AccessSource, BillingRole } from "@/src/billing/types";
import { formatTrialCountdown } from "@/src/lib/trial";
import { getSupabaseAdmin, supabaseAdminConfigured } from "@/src/lib/supabaseServer";

type SubscriptionRow = {
  id: string;
  owner_user_id: string;
  provider: "paddle" | "manual";
  provider_subscription_id?: string | null;
  plan_code: PaidPlanCode;
  seat_limit: number | null;
  status: "active" | "inactive" | "past_due" | "canceled";
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  billing_interval: string;
  auto_renew: boolean;
  renewal_mode: "auto" | "end_of_term";
  pending_plan_code?: PaidPlanCode | null;
  change_effective_at?: string | null;
  change_type?: "upgrade" | "downgrade" | "switch" | "renewal" | null;
  created_at: string;
};

type ProfileTrialRow = {
  trial_started_at: string | null;
  trial_ends_at: string | null;
};

async function getAuthedUser(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  if (!token || !supabaseAdminConfigured) {
    return null;
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }
  return { supabase, user: data.user };
}

function inAccessWindow(subscription: Pick<SubscriptionRow, "current_period_end">) {
  return (
    !subscription.current_period_end ||
    new Date(subscription.current_period_end).getTime() > Date.now()
  );
}

function rankActiveSubscription(subscription: SubscriptionRow) {
  if (subscription.provider === "paddle") {
    return 200;
  }
  if (subscription.provider === "manual") {
    return 150;
  }
  return 100;
}

function pickActiveOwnerSubscription(rows: SubscriptionRow[]) {
  return [...rows]
    .filter((row) => row.status === "active" && inAccessWindow(row))
    .sort((a, b) => {
      const rankDiff = rankActiveSubscription(b) - rankActiveSubscription(a);
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0] ?? null;
}

function pickLatestSubscription(rows: SubscriptionRow[]) {
  return [...rows].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0] ?? null;
}

export async function GET(request: Request) {
  const auth = await getAuthedUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { supabase, user } = auth;
  const { data: ownerSubscriptions } = await supabase
    .from("subscriptions")
    .select(
      "id, owner_user_id, provider, provider_subscription_id, plan_code, seat_limit, status, current_period_end, cancel_at_period_end, billing_interval, auto_renew, renewal_mode, pending_plan_code, change_effective_at, change_type, created_at"
    )
    .eq("owner_user_id", user.id)
    .returns<SubscriptionRow[]>();

  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_started_at, trial_ends_at")
    .eq("id", user.id)
    .maybeSingle<ProfileTrialRow>();

  const trialEndsAt = profile?.trial_ends_at ?? null;
  const trialActive = Boolean(
    trialEndsAt && new Date(trialEndsAt).getTime() > Date.now()
  );

  const ownerRows = ownerSubscriptions ?? [];
  const activeOwnerSubscription = pickActiveOwnerSubscription(ownerRows);
  const latestOwnerSubscription = pickLatestSubscription(ownerRows);

  let subscription = activeOwnerSubscription;
  let latestSubscription = latestOwnerSubscription;
  let billingRole: BillingRole = "none";
  let accessSource: AccessSource = "free";

  if (subscription) {
    billingRole = "owner";
    accessSource = subscription.provider === "manual" ? "complimentary" : "subscription";
  } else {
    const { data: membership } = await supabase
      .from("subscription_members")
      .select(
        "subscription_id, subscriptions!inner(id, owner_user_id, provider, provider_subscription_id, plan_code, seat_limit, status, current_period_end, cancel_at_period_end, billing_interval, auto_renew, renewal_mode, pending_plan_code, change_effective_at, change_type, created_at)"
      )
      .eq("member_user_id", user.id)
      .limit(1)
      .maybeSingle<{ subscriptions: SubscriptionRow }>();

    if (membership?.subscriptions && membership.subscriptions.status === "active" && inAccessWindow(membership.subscriptions)) {
      subscription = membership.subscriptions;
      latestSubscription = latestSubscription ?? membership.subscriptions;
      billingRole = "member";
      accessSource = "subscription";
    } else if (trialActive) {
      accessSource = "trial";
    } else if (latestSubscription?.provider === "manual") {
      accessSource = "complimentary";
    } else {
      accessSource = "free";
      billingRole = "none";
    }
  }

  let members: { id: string; email: string | null; created_at: string }[] = [];
  if (billingRole === "owner" && subscription && subscription.plan_code !== "individual") {
    const { data } = await supabase
      .from("subscription_members")
      .select("id, created_at, member_user_id")
      .eq("subscription_id", subscription.id)
      .order("created_at", { ascending: true });
    const memberRows = data ?? [];
    if (memberRows.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in(
          "id",
          memberRows.map((row) => row.member_user_id)
        );
      const emailById = new Map(
        (profiles ?? []).map((profileRow) => [profileRow.id, profileRow.email ?? null])
      );
      members = memberRows.map((row) => ({
        id: row.id,
        email: emailById.get(row.member_user_id) ?? null,
        created_at: row.created_at,
      }));
    }
  }

  const seatLimit = subscription
    ? subscription.seat_limit ?? getSeatLimitForPlanCode(subscription.plan_code)
    : 0;
  const seatsUsed =
    billingRole === "owner" && subscription && subscription.plan_code !== "individual"
      ? 1 + members.length
      : subscription
        ? 1
        : 0;

  const showPlanOptions = billingRole !== "member";

  return NextResponse.json({
    subscription,
    latest_subscription:
      latestSubscription && latestSubscription.id !== subscription?.id
        ? latestSubscription
        : subscription && (!inAccessWindow(subscription) || subscription.status !== "active")
          ? subscription
          : null,
    billing_role: billingRole,
    access_source: accessSource,
    members,
    seats_used: seatsUsed,
    seats_remaining:
      subscription && seatLimit !== null ? Math.max(seatLimit - seatsUsed, 0) : 0,
    trial_active: trialActive,
    trial_ends_at: trialEndsAt,
    trial_countdown: formatTrialCountdown(
      Date.now(),
      trialEndsAt,
      profile?.trial_started_at ?? null
    ),
    show_plan_options: showPlanOptions,
  });
}
