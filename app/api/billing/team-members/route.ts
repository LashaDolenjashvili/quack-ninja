import { NextResponse } from "next/server";
import type { PaidPlanCode } from "@/src/billing/catalog";
import { getSeatLimitForPlanCode } from "@/src/billing/catalog";
import { getSupabaseAdmin, supabaseAdminConfigured } from "@/src/lib/supabaseServer";

type TeamMembershipPayload = {
  email?: string;
  member_id?: string;
};

type SubscriptionRow = {
  id: string;
  owner_user_id: string;
  plan_code: PaidPlanCode;
  seat_limit: number | null;
  status: "active" | "inactive" | "past_due" | "canceled";
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

async function getOwnerTeamSubscription(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string
) {
  const { data } = await supabase
    .from("subscriptions")
    .select("id, owner_user_id, plan_code, seat_limit, status")
    .eq("owner_user_id", userId)
    .neq("plan_code", "individual")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>();
  return data ?? null;
}

export async function POST(request: Request) {
  const auth = await getAuthedUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const payload = (await request.json().catch(() => null)) as TeamMembershipPayload | null;
  const email = payload?.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const { supabase, user } = auth;
  const subscription = await getOwnerTeamSubscription(supabase, user.id);
  if (!subscription || subscription.status !== "active") {
    return NextResponse.json(
      { error: "Active Team subscription required." },
      { status: 403 }
    );
  }

  const seatLimit =
    subscription.seat_limit ?? getSeatLimitForPlanCode(subscription.plan_code);
  const { count } = await supabase
    .from("subscription_members")
    .select("*", { count: "exact", head: true })
    .eq("subscription_id", subscription.id);
  const seatsUsed = 1 + (count ?? 0);
  if (seatLimit !== null && seatsUsed >= seatLimit) {
    return NextResponse.json({ error: "No seats remaining." }, { status: 409 });
  }

  const { data: memberProfile } = await supabase
    .from("profiles")
    .select("id, email, billing_role")
    .ilike("email", email)
    .maybeSingle<{
      id: string;
      email: string | null;
      billing_role?: string | null;
    }>();

  if (!memberProfile) {
    return NextResponse.json(
      { error: "User must already have a QuackNinja account." },
      { status: 404 }
    );
  }
  if (memberProfile.id === user.id) {
    return NextResponse.json(
      { error: "Owner already occupies a seat." },
      { status: 400 }
    );
  }

  const { data: existingMembership } = await supabase
    .from("subscription_members")
    .select("id")
    .eq("member_user_id", memberProfile.id)
    .maybeSingle();

  if (existingMembership) {
    return NextResponse.json(
      { error: "This user already belongs to another team." },
      { status: 409 }
    );
  }

  const { error: insertError } = await supabase.from("subscription_members").insert({
    subscription_id: subscription.id,
    owner_user_id: user.id,
    member_user_id: memberProfile.id,
  });
  if (insertError) {
    return NextResponse.json(
      { error: "Failed to assign team member." },
      { status: 500 }
    );
  }

  await supabase
    .from("profiles")
    .update({ plan: "pro", billing_role: "member" })
    .eq("id", memberProfile.id);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await getAuthedUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as TeamMembershipPayload | null;
  const memberId = payload?.member_id?.trim();
  if (!memberId) {
    return NextResponse.json({ error: "member_id is required." }, { status: 400 });
  }

  const { supabase, user } = auth;
  const subscription = await getOwnerTeamSubscription(supabase, user.id);
  if (!subscription) {
    return NextResponse.json(
      { error: "Active Team subscription required." },
      { status: 403 }
    );
  }

  const { data: membership } = await supabase
    .from("subscription_members")
    .select("id, member_user_id")
    .eq("id", memberId)
    .eq("owner_user_id", user.id)
    .maybeSingle<{
      id: string;
      member_user_id: string;
    }>();

  if (!membership) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  await supabase
    .from("subscription_members")
    .delete()
    .eq("id", membership.id)
    .eq("owner_user_id", user.id);

  await supabase
    .from("profiles")
    .update({ plan: "free", billing_role: "none" })
    .eq("id", membership.member_user_id);

  return NextResponse.json({ ok: true });
}
