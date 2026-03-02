import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PaddleWebhookPayload = {
  event_type?: string;
  data?: Record<string, unknown>;
};

type LocalStatus = "active" | "inactive" | "past_due" | "canceled";
type PlanCode = "individual" | "team_5" | "team_10" | "team_unlimited";

function parseSignature(header: string | null) {
  if (!header) {
    return null;
  }
  const parts = Object.fromEntries(
    header.split(";").map((entry) => {
      const [key, value] = entry.split("=", 2);
      return [key, value];
    })
  );
  if (!parts.ts || !parts.h1) {
    return null;
  }
  return { ts: parts.ts, h1: parts.h1 };
}

async function computeHmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPaddleSignature(
  rawBody: string,
  header: string | null,
  secret: string
) {
  const parsed = parseSignature(header);
  if (!parsed) {
    return false;
  }
  const expected = await computeHmac(secret, `${parsed.ts}:${rawBody}`);
  return expected === parsed.h1;
}

function parsePlanCode(value: unknown): PlanCode | null {
  return value === "individual" ||
      value === "team_5" ||
      value === "team_10" ||
      value === "team_unlimited"
    ? value
    : null;
}

function getSeatLimit(planCode: PlanCode) {
  switch (planCode) {
    case "individual":
      return 1;
    case "team_5":
      return 5;
    case "team_10":
      return 10;
    case "team_unlimited":
      return null;
  }
}

function parseSeatLimit(value: unknown, fallback: PlanCode) {
  if (value === "unlimited" || value === null) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.trunc(value));
  }
  if (typeof value === "string") {
    const numeric = Number.parseInt(value, 10);
    if (Number.isFinite(numeric)) {
      return Math.max(1, numeric);
    }
  }
  return getSeatLimit(fallback);
}

function mapStatus(eventType: string | undefined, statusValue: unknown): LocalStatus {
  const normalizedStatus =
    typeof statusValue === "string" ? statusValue.toLowerCase() : "";
  const normalizedEvent = (eventType ?? "").toLowerCase();
  if (
    normalizedStatus === "active" ||
    normalizedEvent.includes("activated") ||
    normalizedEvent.includes("resumed")
  ) {
    return "active";
  }
  if (
    normalizedStatus === "past_due" ||
    normalizedStatus === "paused" ||
    normalizedEvent.includes("past_due") ||
    normalizedEvent.includes("payment_failed") ||
    normalizedEvent.includes("paused")
  ) {
    return "past_due";
  }
  if (
    normalizedStatus === "canceled" ||
    normalizedEvent.includes("canceled")
  ) {
    return "canceled";
  }
  return "inactive";
}

function getField<T>(
  source: Record<string, unknown> | null | undefined,
  key: string
) {
  return (source?.[key] as T | undefined) ?? undefined;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = Deno.env.get("PADDLE_WEBHOOK_SECRET");
  if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
    return new Response("Missing Supabase or Paddle env", { status: 500 });
  }

  const rawBody = await req.text();
  const signatureValid = await verifyPaddleSignature(
    rawBody,
    req.headers.get("paddle-signature"),
    webhookSecret
  );
  if (!signatureValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: PaddleWebhookPayload | null = null;
  try {
    payload = JSON.parse(rawBody) as PaddleWebhookPayload;
  } catch {
    payload = null;
  }
  if (!payload?.data) {
    return new Response("Invalid payload", { status: 400 });
  }

  const eventType = payload.event_type;
  const data = payload.data;
  const item = Array.isArray(getField<unknown[]>(data, "items"))
    ? (getField<unknown[]>(data, "items")?.[0] as Record<string, unknown> | undefined)
    : undefined;
  const price = (getField<Record<string, unknown>>(item, "price") ?? null) as
    | Record<string, unknown>
    | null;
  const metadataSources = [
    getField<Record<string, unknown>>(data, "custom_data"),
    getField<Record<string, unknown>>(item, "custom_data"),
    getField<Record<string, unknown>>(price, "custom_data"),
    getField<Record<string, unknown>>(price, "metadata"),
  ].filter(Boolean) as Record<string, unknown>[];
  const mergedMetadata = Object.assign({}, ...metadataSources);

  const ownerUserId = getField<string>(mergedMetadata, "user_id");
  const planCode = parsePlanCode(
    getField<string>(mergedMetadata, "plan_code")
  );
  if (!ownerUserId || !planCode) {
    return new Response("Missing billing metadata", { status: 400 });
  }

  const status = mapStatus(eventType, getField<string>(data, "status"));
  const seatLimit = parseSeatLimit(
    getField<unknown>(mergedMetadata, "seat_limit"),
    planCode
  );
  const currentPeriodEnd =
    getField<Record<string, unknown>>(data, "current_billing_period")?.[
      "ends_at"
    ] as string | undefined ??
    getField<string>(data, "current_period_end") ??
    null;
  const cancelAtPeriodEnd = Boolean(
    getField<Record<string, unknown>>(data, "scheduled_change")?.["action"] ===
      "cancel" || getField<boolean>(data, "cancel_at_period_end")
  );
  const providerSubscriptionId =
    getField<string>(data, "id") ??
    getField<string>(data, "subscription_id") ??
    null;
  const providerCustomerId =
    getField<string>(data, "customer_id") ??
    getField<string>(data, "provider_customer_id") ??
    null;
  const paddleProductId =
    getField<string>(price, "product_id") ??
    getField<string>(item, "product_id") ??
    null;
  const paddlePriceId =
    getField<string>(price, "id") ??
    getField<string>(item, "price_id") ??
    null;
  const amountRaw = getField<Record<string, unknown>>(price, "unit_price")?.[
    "amount"
  ];
  const amountCents =
    typeof amountRaw === "string"
      ? Number.parseInt(amountRaw, 10)
      : typeof amountRaw === "number"
        ? Math.trunc(amountRaw)
        : null;
  const currencyCode =
    (getField<Record<string, unknown>>(price, "unit_price")?.[
      "currency_code"
    ] as string | undefined) ??
    getField<string>(data, "currency_code") ??
    null;

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const upsertPayload = {
    owner_user_id: ownerUserId,
    user_id: ownerUserId,
    provider: "paddle",
    provider_customer_id: providerCustomerId,
    provider_subscription_id: providerSubscriptionId,
    paddle_product_id: paddleProductId,
    paddle_price_id: paddlePriceId,
    plan_code: planCode,
    seat_limit: seatLimit,
    billing_interval: "month",
    currency_code: currencyCode,
    amount_cents: amountCents,
    status,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
  };

  const { data: upserted } = await supabase
    .from("subscriptions")
    .upsert(upsertPayload, {
      onConflict: providerSubscriptionId ? "provider_subscription_id" : undefined,
    })
    .select("id")
    .limit(1)
    .maybeSingle();

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("trial_ends_at")
    .eq("id", ownerUserId)
    .maybeSingle<{ trial_ends_at?: string | null }>();

  const trialActive = Boolean(
    ownerProfile?.trial_ends_at &&
      new Date(ownerProfile.trial_ends_at).getTime() > Date.now()
  );
  const ownerPlan = status === "active" || trialActive ? "pro" : "free";
  const ownerRole = status === "active" ? "owner" : "none";

  await supabase
    .from("profiles")
    .update({ plan: ownerPlan, billing_role: ownerRole })
    .eq("id", ownerUserId);

  if (planCode !== "individual" && upserted?.id) {
    const { data: currentMembers } = await supabase
      .from("subscription_members")
      .select("member_user_id")
      .eq("subscription_id", upserted.id);

    if (status === "active") {
      const memberIds = (currentMembers ?? []).map((member) => member.member_user_id);
      if (memberIds.length > 0) {
        await supabase
          .from("profiles")
          .update({ plan: "pro", billing_role: "member" })
          .in("id", memberIds);
      }
    } else {
      const memberIds = (currentMembers ?? []).map((member) => member.member_user_id);
      if (memberIds.length > 0) {
        await supabase
          .from("profiles")
          .update({ plan: "free", billing_role: "none" })
          .in("id", memberIds);
      }
      await supabase
        .from("subscription_members")
        .delete()
        .eq("subscription_id", upserted.id);
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
