import { NextResponse } from "next/server";
import { getSeatLimitForPlanCode, type PaidPlanCode } from "@/src/billing/catalog";
import { getSupabaseAdmin, supabaseAdminConfigured } from "@/src/lib/supabaseServer";

type SubscriptionRow = {
  id: string;
  owner_user_id: string;
  provider: "paddle" | "manual";
  plan_code: PaidPlanCode;
  seat_limit: number | null;
  status: "active" | "inactive" | "past_due" | "canceled";
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  billing_interval: string;
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

async function findSubscriptionForUser(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string
) {
  const { data: ownerSubscription } = await supabase
    .from("subscriptions")
    .select(
      "id, owner_user_id, provider, plan_code, seat_limit, status, current_period_end, cancel_at_period_end, billing_interval"
    )
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>();

  if (ownerSubscription) {
    return { subscription: ownerSubscription, role: "owner" as const };
  }

  const { data: membership } = await supabase
    .from("subscription_members")
        .select(
      "subscription_id, owner_user_id, subscriptions!inner(id, owner_user_id, provider, plan_code, seat_limit, status, current_period_end, cancel_at_period_end, billing_interval)"
    )
    .eq("member_user_id", userId)
    .limit(1)
    .maybeSingle<{
      subscriptions: SubscriptionRow;
    }>();

  if (membership?.subscriptions) {
    return { subscription: membership.subscriptions, role: "member" as const };
  }

  return { subscription: null, role: "none" as const };
}

export async function GET(request: Request) {
  const auth = await getAuthedUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { supabase, user } = auth;
  const { subscription, role } = await findSubscriptionForUser(supabase, user.id);

  if (!subscription) {
    return NextResponse.json({
      subscription: null,
      billing_role: "none",
      members: [],
      seats_used: 0,
      seats_remaining: 0,
    });
  }

  let members: { id: string; email: string | null; created_at: string }[] = [];
  if (role === "owner" && subscription.plan_code !== "individual") {
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
        (profiles ?? []).map((profile) => [profile.id, profile.email ?? null])
      );
      members = memberRows.map((row) => ({
        id: row.id,
        email: emailById.get(row.member_user_id) ?? null,
        created_at: row.created_at,
      }));
    }
  }

  const seatLimit =
    subscription.seat_limit ?? getSeatLimitForPlanCode(subscription.plan_code);
  const seatsUsed =
    role === "owner" && subscription.plan_code !== "individual"
      ? 1 + members.length
      : 1;

  return NextResponse.json({
    subscription,
    billing_role: role,
    members,
    seats_used: seatsUsed,
    seats_remaining:
      seatLimit === null ? null : Math.max(seatLimit - seatsUsed, 0),
  });
}
