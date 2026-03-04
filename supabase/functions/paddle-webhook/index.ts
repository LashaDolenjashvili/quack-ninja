import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PaddleWebhookPayload = {
  event_type?: string;
  data?: Record<string, unknown>;
};

type LocalStatus = "active" | "inactive" | "past_due" | "canceled";
type PlanCode = "individual" | "team_5" | "team_10" | "team_unlimited";
type RenewalMode = "auto" | "end_of_term";

type StoredSubscription = {
  id: string;
  provider_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  auto_renew: boolean;
  renewal_mode: RenewalMode;
  status: LocalStatus;
};

type SubscriptionWritePayload = {
  owner_user_id: string;
  user_id: string;
  provider: "paddle";
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  paddle_product_id: string | null;
  paddle_price_id: string | null;
  plan_code: PlanCode;
  seat_limit: number | null;
  billing_interval: "month";
  currency_code: string | null;
  amount_cents: number | null;
  status: LocalStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  auto_renew: boolean;
  renewal_mode: RenewalMode;
};

function getPaddleBaseUrl() {
  return Deno.env.get("PADDLE_ENV") === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

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
  if (normalizedStatus === "active") {
    return "active";
  }
  if (normalizedStatus === "past_due" || normalizedStatus === "paused") {
    return "past_due";
  }
  if (normalizedStatus === "canceled") {
    return "canceled";
  }
  if (normalizedStatus === "inactive") {
    return "inactive";
  }
  if (
    normalizedEvent.includes("activated") ||
    normalizedEvent.includes("resumed")
  ) {
    return "active";
  }
  if (
    normalizedEvent.includes("past_due") ||
    normalizedEvent.includes("payment_failed") ||
    normalizedEvent.includes("paused")
  ) {
    return "past_due";
  }
  if (normalizedEvent.includes("canceled")) {
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

function getRecord(
  source: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = source?.[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
  }
  return fallback;
}

function normalizePlanLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const normalized = value.toLowerCase();
  if (normalized.includes("team unlimited") || normalized.includes("unlimited")) {
    return "team_unlimited" as const;
  }
  if (normalized.includes("team 10")) {
    return "team_10" as const;
  }
  if (normalized.includes("team 5")) {
    return "team_5" as const;
  }
  if (normalized.includes("individual")) {
    return "individual" as const;
  }
  return null;
}

function planCodeFromConfiguredPriceId(priceId: string | null) {
  if (!priceId) {
    return null;
  }
  const mapping = [
    [Deno.env.get("PADDLE_PRICE_ID_INDIVIDUAL_MONTHLY"), "individual"],
    [Deno.env.get("PADDLE_PRICE_ID_TEAM_5_MONTHLY"), "team_5"],
    [Deno.env.get("PADDLE_PRICE_ID_TEAM_10_MONTHLY"), "team_10"],
    [Deno.env.get("PADDLE_PRICE_ID_TEAM_UNLIMITED_MONTHLY"), "team_unlimited"],
  ] as const;

  for (const [configured, planCode] of mapping) {
    if (configured && configured === priceId) {
      return planCode;
    }
  }
  return null;
}

async function resolveOwnerUserId(
  supabase: ReturnType<typeof createClient>,
  explicitUserId: string | null,
  data: Record<string, unknown>
) {
  if (explicitUserId) {
    return explicitUserId;
  }

  const customerRecord = getRecord(data, "customer");
  const customerEmail =
    getField<string>(customerRecord, "email") ??
    getField<string>(data, "customer_email") ??
    getField<string>(data, "email") ??
    null;

  if (!customerEmail) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", customerEmail)
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("Failed to resolve owner by email", error);
    throw new Error("Failed to resolve billing owner");
  }

  return profile?.id ?? null;
}

async function getStoredSubscription(
  supabase: ReturnType<typeof createClient>,
  providerSubscriptionId: string | null
) {
  if (!providerSubscriptionId) {
    return null;
  }
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, provider_subscription_id, current_period_end, cancel_at_period_end, auto_renew, renewal_mode, status"
    )
    .eq("provider_subscription_id", providerSubscriptionId)
    .maybeSingle<StoredSubscription>();

  if (error) {
    console.error("Failed to load stored subscription", error);
    throw new Error("Failed to load stored subscription");
  }

  return data ?? null;
}

async function upsertSubscription(
  supabase: ReturnType<typeof createClient>,
  existing: StoredSubscription | null,
  payload: SubscriptionWritePayload
) {
  if (existing?.id) {
    const { data: updated, error: updateError } = await supabase
      .from("subscriptions")
      .update(payload)
      .eq("id", existing.id)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (updateError) {
      console.error("Failed to update subscription", updateError);
      throw new Error("Failed to update subscription");
    }

    return updated?.id ?? existing.id;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("subscriptions")
    .insert(payload)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (insertError) {
    console.error("Failed to insert subscription", insertError);
    throw new Error("Failed to insert subscription");
  }

  return inserted?.id ?? null;
}

async function hasActiveOwnerSubscription(
  supabase: ReturnType<typeof createClient>,
  ownerUserId: string
) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("owner_user_id", ownerUserId)
    .eq("status", "active");

  if (error) {
    console.error("Failed to query active owner subscriptions", error);
    throw new Error("Failed to query active owner subscriptions");
  }

  const nowMs = Date.now();
  return (data ?? []).some((subscription) => {
    const periodEnd = subscription.current_period_end as string | null;
    return !periodEnd || new Date(periodEnd).getTime() > nowMs;
  });
}

async function patchSubscriptionInPaddle(
  subscriptionId: string,
  body: Record<string, unknown>,
  apiKey: string
) {
  const response = await fetch(`${getPaddleBaseUrl()}/subscriptions/${subscriptionId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.text();
    console.error("Failed to patch Paddle subscription", payload);
    throw new Error("Failed to patch Paddle subscription");
  }
}

async function syncSubscriptionCustomData(
  subscriptionId: string,
  customData: Record<string, unknown>,
  apiKey: string
) {
  const response = await fetch(`${getPaddleBaseUrl()}/subscriptions/${subscriptionId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      custom_data: customData,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    console.error("Failed to sync Paddle subscription custom data", payload);
    throw new Error("Failed to sync Paddle subscription custom data");
  }
}

async function scheduleCancelAtPeriodEnd(
  subscriptionId: string,
  apiKey: string
) {
  const response = await fetch(
    `${getPaddleBaseUrl()}/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ effective_from: "next_billing_period" }),
    }
  );

  if (!response.ok) {
    const payload = await response.text();
    console.error("Failed to schedule Paddle cancellation", payload);
    throw new Error("Failed to schedule Paddle cancellation");
  }
}

async function fetchPaddleTransaction(
  transactionId: string,
  apiKey: string
) {
  const response = await fetch(
    `${getPaddleBaseUrl()}/transactions/${transactionId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const payload = await response.text();
    console.error("Failed to load Paddle transaction", payload);
    throw new Error("Failed to load Paddle transaction");
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: Record<string, unknown> }
    | null;

  return payload?.data ?? null;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = Deno.env.get("PADDLE_WEBHOOK_SECRET");
  const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
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
  const normalizedEventType = (eventType ?? "").toLowerCase();
  if (!normalizedEventType.startsWith("subscription.")) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = payload.data;
  const transactionId =
    getField<string>(data, "transaction_id") ??
    getField<string>(getRecord(data, "transaction"), "id") ??
    getField<string>(getRecord(data, "origin"), "transaction_id") ??
    null;

  let transactionData: Record<string, unknown> | null = null;
  if (transactionId && paddleApiKey) {
    try {
      transactionData = await fetchPaddleTransaction(transactionId, paddleApiKey);
    } catch (error) {
      console.error("Unable to hydrate transaction metadata", error);
    }
  }

  const transactionItem = Array.isArray(getField<unknown[]>(transactionData, "items"))
    ? (getField<unknown[]>(transactionData, "items")?.[0] as Record<string, unknown> | undefined)
    : undefined;
  const item = Array.isArray(getField<unknown[]>(data, "items"))
    ? (getField<unknown[]>(data, "items")?.[0] as Record<string, unknown> | undefined)
    : transactionItem;
  const price = getRecord(item ?? null, "price") ?? getRecord(transactionItem ?? null, "price");
  const product = getRecord(price, "product");
  const metadataSources = [
    getField<Record<string, unknown>>(data, "custom_data"),
    getField<Record<string, unknown>>(item, "custom_data"),
    getField<Record<string, unknown>>(price, "custom_data"),
    getField<Record<string, unknown>>(price, "metadata"),
    getField<Record<string, unknown>>(transactionData, "custom_data"),
    getField<Record<string, unknown>>(transactionItem, "custom_data"),
    getField<Record<string, unknown>>(getRecord(transactionItem ?? null, "price"), "custom_data"),
    getField<Record<string, unknown>>(getRecord(transactionItem ?? null, "price"), "metadata"),
  ].filter(Boolean) as Record<string, unknown>[];
  const mergedMetadata = Object.assign({}, ...metadataSources);
  const providerSubscriptionId =
    getField<string>(data, "id") ??
    getField<string>(data, "subscription_id") ??
    null;
  const providerCustomerId =
    getField<string>(data, "customer_id") ??
    getField<string>(transactionData, "customer_id") ??
    getField<string>(data, "provider_customer_id") ??
    null;
  const currentPeriodEnd =
    getField<Record<string, unknown>>(data, "current_billing_period")?.[
      "ends_at"
    ] as string | undefined ??
    getField<string>(data, "current_period_end") ??
    getField<string>(data, "next_billed_at") ??
    null;
  const cancelAtPeriodEnd = Boolean(
    getField<Record<string, unknown>>(data, "scheduled_change")?.["action"] ===
      "cancel" || getField<boolean>(data, "cancel_at_period_end")
  );
  const paddleProductId =
    getField<string>(price, "product_id") ??
    getField<string>(item, "product_id") ??
    null;
  const paddlePriceId =
    getField<string>(price, "id") ??
    getField<string>(item, "price_id") ??
    getField<string>(getRecord(transactionItem ?? null, "price"), "id") ??
    null;
  const planCode =
    parsePlanCode(getField<string>(mergedMetadata, "plan_code")) ??
    parsePlanCode(getField<string>(getRecord(product, "custom_data"), "plan_code")) ??
    parsePlanCode(getField<string>(getRecord(product, "metadata"), "plan_code")) ??
    planCodeFromConfiguredPriceId(paddlePriceId) ??
    normalizePlanLabel(
      getField<string>(price, "name") ??
        getField<string>(item, "price_name") ??
        getField<string>(product, "name")
    );
  const seatLimit = planCode
    ? parseSeatLimit(getField<unknown>(mergedMetadata, "seat_limit"), planCode)
    : null;
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
  const ownerUserId = await resolveOwnerUserId(
    supabase,
    getField<string>(mergedMetadata, "user_id") ?? null,
    transactionData ?? data
  );
  if (!ownerUserId || !planCode) {
    console.error("Unable to resolve billing metadata", {
      eventType,
      providerSubscriptionId,
      paddlePriceId,
      ownerUserId,
      planCode,
    });
    return new Response("Unable to resolve billing metadata", { status: 500 });
  }

  const autoRenew = parseBoolean(getField<unknown>(mergedMetadata, "auto_renew"), true);
  const trialEndsAtFromMetadata = getField<string>(mergedMetadata, "trial_ends_at") ?? null;
  const status = mapStatus(eventType, getField<string>(data, "status"));

  try {
    const existing = await getStoredSubscription(supabase, providerSubscriptionId);

    const shouldAttemptTrialDeferral = Boolean(
      paddleApiKey &&
        providerSubscriptionId &&
        status === "active" &&
        trialEndsAtFromMetadata &&
        (!existing?.current_period_end ||
          new Date(existing.current_period_end).getTime() >
            new Date(trialEndsAtFromMetadata).getTime())
    );

    const shouldScheduleCancellation = Boolean(
      paddleApiKey &&
        providerSubscriptionId &&
        !autoRenew &&
        status === "active" &&
        !cancelAtPeriodEnd &&
        !existing?.cancel_at_period_end
    );

    const persistedCancelAtPeriodEnd = cancelAtPeriodEnd || !autoRenew;
    const persistedAutoRenew = autoRenew && !cancelAtPeriodEnd;

    const subscriptionId = await upsertSubscription(supabase, existing, {
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
      cancel_at_period_end: persistedCancelAtPeriodEnd,
      auto_renew: persistedAutoRenew,
      renewal_mode: persistedAutoRenew ? "auto" : "end_of_term",
    });

    if (!subscriptionId) {
      throw new Error("Failed to persist subscription");
    }

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("trial_ends_at")
      .eq("id", ownerUserId)
      .maybeSingle<{ trial_ends_at?: string | null }>();

    const trialActive = Boolean(
      ownerProfile?.trial_ends_at &&
        new Date(ownerProfile.trial_ends_at).getTime() > Date.now()
    );
    const hasAnyActiveOwnerSubscription = await hasActiveOwnerSubscription(
      supabase,
      ownerUserId
    );
    const ownerPlan = hasAnyActiveOwnerSubscription || trialActive ? "pro" : "free";
    const ownerRole = hasAnyActiveOwnerSubscription ? "owner" : "none";

    const { error: ownerUpdateError } = await supabase
      .from("profiles")
      .update({ plan: ownerPlan, billing_role: ownerRole })
      .eq("id", ownerUserId);

    if (ownerUpdateError) {
      console.error("Failed to update owner profile", ownerUpdateError);
      throw new Error("Failed to update owner profile");
    }

    if (planCode !== "individual") {
      const { data: currentMembers, error: membersError } = await supabase
        .from("subscription_members")
        .select("member_user_id")
        .eq("subscription_id", subscriptionId);
      if (membersError) {
        console.error("Failed to load team members", membersError);
        throw new Error("Failed to load team members");
      }

      if (status === "active") {
        const memberIds = (currentMembers ?? []).map((member) => member.member_user_id);
        if (memberIds.length > 0) {
          const { error: memberUpdateError } = await supabase
            .from("profiles")
            .update({ plan: "pro", billing_role: "member" })
            .in("id", memberIds);
          if (memberUpdateError) {
            console.error("Failed to activate team members", memberUpdateError);
            throw new Error("Failed to activate team members");
          }
        }
      } else {
        const memberIds = (currentMembers ?? []).map((member) => member.member_user_id);
        if (memberIds.length > 0) {
          const { error: memberDowngradeError } = await supabase
            .from("profiles")
            .update({ plan: "free", billing_role: "none" })
            .in("id", memberIds);
          if (memberDowngradeError) {
            console.error("Failed to downgrade team members", memberDowngradeError);
            throw new Error("Failed to downgrade team members");
          }
        }
        const { error: memberDeleteError } = await supabase
          .from("subscription_members")
          .delete()
          .eq("subscription_id", subscriptionId);
        if (memberDeleteError) {
          console.error("Failed to clear team members", memberDeleteError);
          throw new Error("Failed to clear team members");
        }
      }
    }

    let finalCurrentPeriodEnd = currentPeriodEnd;
    let finalCancelAtPeriodEnd = persistedCancelAtPeriodEnd;
    let finalAutoRenew = persistedAutoRenew;
    let requiresRetry = false;

    if (paddleApiKey && providerSubscriptionId) {
      try {
        await syncSubscriptionCustomData(
          providerSubscriptionId as string,
          {
            auto_renew: finalAutoRenew,
            plan_code: planCode,
          },
          paddleApiKey as string
        );
      } catch (error) {
        console.error(error);
        requiresRetry = true;
      }
    }

    if (shouldAttemptTrialDeferral) {
      try {
        await patchSubscriptionInPaddle(
          providerSubscriptionId as string,
          {
            next_billed_at: trialEndsAtFromMetadata,
            proration_billing_mode: "do_not_bill",
          },
          paddleApiKey as string
        );
        finalCurrentPeriodEnd = trialEndsAtFromMetadata;
      } catch (error) {
        console.error(error);
        requiresRetry = true;
      }
    }

    if (shouldScheduleCancellation) {
      try {
        await scheduleCancelAtPeriodEnd(
          providerSubscriptionId as string,
          paddleApiKey as string
        );
        finalCancelAtPeriodEnd = true;
        finalAutoRenew = false;
      } catch (error) {
        console.error(error);
        requiresRetry = true;
      }
    }

    if (
      finalCurrentPeriodEnd !== currentPeriodEnd ||
      finalCancelAtPeriodEnd !== persistedCancelAtPeriodEnd ||
      finalAutoRenew !== persistedAutoRenew
    ) {
      const { error: finalizeError } = await supabase
        .from("subscriptions")
        .update({
          current_period_end: finalCurrentPeriodEnd,
          cancel_at_period_end: finalCancelAtPeriodEnd,
          auto_renew: finalAutoRenew,
          renewal_mode: finalAutoRenew ? "auto" : "end_of_term",
        })
        .eq("id", subscriptionId);

      if (finalizeError) {
        console.error("Failed to finalize subscription sync", finalizeError);
        throw new Error("Failed to finalize subscription sync");
      }
    }

    if (requiresRetry) {
      return new Response("Subscription synced locally; retrying provider-side updates", {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      error instanceof Error ? error.message : "Webhook processing failed",
      { status: 500 }
    );
  }
});
