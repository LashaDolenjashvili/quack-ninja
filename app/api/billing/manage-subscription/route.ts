import { NextResponse } from "next/server";
import {
  cancelPaddleSubscription,
  clearPaddleScheduledChange,
  updatePaddleSubscriptionCustomData,
} from "@/src/billing/paddleServer";
import { getSupabaseAdmin, supabaseAdminConfigured } from "@/src/lib/supabaseServer";

type Action = "enable_auto_renew" | "disable_auto_renew" | "cancel_now";

type Payload = {
  action: Action;
};

type SubscriptionRow = {
  id: string;
  provider_subscription_id: string | null;
  plan_code: "individual" | "team_5" | "team_10" | "team_unlimited";
  status: "active" | "inactive" | "past_due" | "canceled";
  current_period_end: string | null;
  provider: "paddle" | "manual";
};

function parsePayload(payload: unknown): Payload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const maybe = payload as { action?: unknown };
  if (
    maybe.action !== "enable_auto_renew" &&
    maybe.action !== "disable_auto_renew" &&
    maybe.action !== "cancel_now"
  ) {
    return null;
  }
  return { action: maybe.action };
}

function isInAccessWindow(currentPeriodEnd: string | null) {
  return !currentPeriodEnd || new Date(currentPeriodEnd).getTime() > Date.now();
}

async function hasAnyActiveOwnerSubscription(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  ownerUserId: string
) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("owner_user_id", ownerUserId)
    .eq("status", "active");

  if (error) {
    throw new Error("Failed to verify owner access.");
  }

  return (data ?? []).some((row) =>
    isInAccessWindow((row.current_period_end as string | null) ?? null)
  );
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

  const parsed = parsePayload(await request.json().catch(() => null));
  if (!parsed) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, provider_subscription_id, plan_code, status, current_period_end, provider")
    .eq("owner_user_id", authData.user.id)
    .eq("provider", "paddle")
    .eq("status", "active")
    .returns<SubscriptionRow[]>();

  const subscription =
    (subscriptions ?? [])
      .filter((row) => isInAccessWindow(row.current_period_end))
      .sort(
        (a, b) =>
          new Date(b.current_period_end ?? 0).getTime() -
          new Date(a.current_period_end ?? 0).getTime()
      )[0] ?? null;

  if (!subscription || !subscription.provider_subscription_id) {
    return NextResponse.json(
      { error: "No active Paddle subscription to manage." },
      { status: 404 }
    );
  }

  try {
    if (parsed.action === "disable_auto_renew") {
      await cancelPaddleSubscription({
        providerSubscriptionId: subscription.provider_subscription_id,
        effectiveFrom: "next_billing_period",
      });
      await updatePaddleSubscriptionCustomData({
        providerSubscriptionId: subscription.provider_subscription_id,
        customData: {
          auto_renew: false,
          plan_code: subscription.plan_code,
        },
      });

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          cancel_at_period_end: true,
          auto_renew: false,
          renewal_mode: "end_of_term",
        })
        .eq("id", subscription.id);

      if (updateError) {
        throw new Error("Failed to store the renewal change.");
      }

      return NextResponse.json({
        ok: true,
        message: "Auto-renew is now off. This plan will end at the close of the current term.",
      });
    }

    if (parsed.action === "enable_auto_renew") {
      await clearPaddleScheduledChange(subscription.provider_subscription_id);
      await updatePaddleSubscriptionCustomData({
        providerSubscriptionId: subscription.provider_subscription_id,
        customData: {
          auto_renew: true,
          plan_code: subscription.plan_code,
        },
      });

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          cancel_at_period_end: false,
          auto_renew: true,
          renewal_mode: "auto",
        })
        .eq("id", subscription.id);

      if (updateError) {
        throw new Error("Failed to store the renewal change.");
      }

      return NextResponse.json({
        ok: true,
        message: "Auto-renew is now on for the current plan.",
      });
    }

    await cancelPaddleSubscription({
      providerSubscriptionId: subscription.provider_subscription_id,
      effectiveFrom: "immediately",
    });

    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        current_period_end: nowIso,
        cancel_at_period_end: false,
        auto_renew: false,
        renewal_mode: "end_of_term",
      })
      .eq("id", subscription.id);

    if (updateError) {
      throw new Error("Failed to store the cancellation.");
    }

    if (subscription.plan_code !== "individual") {
      const { data: currentMembers, error: membersError } = await supabase
        .from("subscription_members")
        .select("member_user_id")
        .eq("subscription_id", subscription.id);
      if (membersError) {
        throw new Error("Failed to load team members.");
      }

      const memberIds = (currentMembers ?? []).map((member) => member.member_user_id);
      if (memberIds.length > 0) {
        const { error: memberUpdateError } = await supabase
          .from("profiles")
          .update({ plan: "free", billing_role: "none" })
          .in("id", memberIds);
        if (memberUpdateError) {
          throw new Error("Failed to downgrade team members.");
        }
      }

      const { error: deleteError } = await supabase
        .from("subscription_members")
        .delete()
        .eq("subscription_id", subscription.id);
      if (deleteError) {
        throw new Error("Failed to clear team members.");
      }
    }

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("trial_ends_at")
      .eq("id", authData.user.id)
      .maybeSingle<{ trial_ends_at?: string | null }>();

    const trialActive = Boolean(
      ownerProfile?.trial_ends_at &&
        new Date(ownerProfile.trial_ends_at).getTime() > Date.now()
    );
    const hasOtherActive = await hasAnyActiveOwnerSubscription(supabase, authData.user.id);

    const { error: ownerUpdateError } = await supabase
      .from("profiles")
      .update({
        plan: hasOtherActive || trialActive ? "pro" : "free",
        billing_role: hasOtherActive ? "owner" : "none",
      })
      .eq("id", authData.user.id);

    if (ownerUpdateError) {
      throw new Error("Failed to update the owner profile.");
    }

    return NextResponse.json({
      ok: true,
      message: "The subscription was canceled immediately.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to manage the subscription.",
      },
      { status: 502 }
    );
  }
}
