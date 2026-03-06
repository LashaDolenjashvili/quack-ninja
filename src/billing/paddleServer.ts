import {
  getPaddlePriceIdForPlanCode,
  getSuccessUrl,
  type PaidPlanCode,
} from "@/src/billing/catalog";

type PaddleResponse<T> = {
  data?: T;
  error?: {
    detail?: string;
  };
};

function getPaddleBaseUrl() {
  return process.env.PADDLE_ENV === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

function getPaddleApiKey() {
  const apiKey = process.env.PADDLE_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new Error("Missing Paddle API key.");
  }
  return apiKey;
}

async function paddleRequest<T>(
  path: string,
  init: RequestInit
): Promise<PaddleResponse<T>> {
  const response = await fetch(`${getPaddleBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getPaddleApiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | PaddleResponse<T>
    | null;

  if (!response.ok) {
    const detail = payload?.error?.detail ?? "Paddle request failed.";
    if (detail.toLowerCase().includes("not authorized")) {
      throw new Error(
        "Your Paddle API key is missing subscription management permission. Update the key to allow subscription read and write access."
      );
    }
    throw new Error(
      detail
    );
  }

  return payload ?? {};
}

export function getPlanRank(planCode: PaidPlanCode) {
  switch (planCode) {
    case "individual":
      return 1;
    case "team_5":
      return 2;
    case "team_10":
      return 3;
    case "team_unlimited":
      return 4;
  }
}

export async function createPaddleTransaction({
  userId,
  email,
  planCode,
  autoRenew,
  trialEndsAt,
  trialRemainingSeconds,
}: {
  userId: string;
  email: string | null;
  planCode: PaidPlanCode;
  autoRenew: boolean;
  trialEndsAt: string | null;
  trialRemainingSeconds: number;
}) {
  const priceId = getPaddlePriceIdForPlanCode(planCode);
  if (!priceId) {
    throw new Error("Missing Paddle price configuration.");
  }

  const requestBody: Record<string, unknown> = {
    items: [{ price_id: priceId, quantity: 1 }],
    customer_email: email ?? undefined,
    collection_mode: "automatic",
    custom_data: {
      user_id: userId,
      plan_code: planCode,
      auto_renew: autoRenew,
      trial_ends_at: trialEndsAt,
      trial_remaining_seconds: trialRemainingSeconds,
    },
    checkout: {
      success_url: getSuccessUrl(),
    },
  };

  if (trialEndsAt && trialRemainingSeconds > 0) {
    requestBody.discount = {
      description: "Remaining QuackNinja trial",
      type: "percentage",
      amount: "100",
      recur: false,
    };
  }

  const payload = await paddleRequest<{
    id?: string;
    checkout?: {
      url?: string | null;
    } | null;
  }>("/transactions", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  if (!payload.data?.id) {
    throw new Error("Unable to create Paddle checkout transaction.");
  }

  const checkoutUrl =
    typeof payload.data.checkout?.url === "string"
      ? payload.data.checkout.url
      : null;
  if (!checkoutUrl) {
    throw new Error(
      "Unable to create Paddle checkout URL. Configure a Default Payment Link in Paddle Checkout settings and try again."
    );
  }

  return {
    transactionId: payload.data.id,
    checkoutUrl,
  };
}

export async function updatePaddleSubscriptionPlan({
  providerSubscriptionId,
  planCode,
  immediate,
}: {
  providerSubscriptionId: string;
  planCode: PaidPlanCode;
  immediate: boolean;
}) {
  const priceId = getPaddlePriceIdForPlanCode(planCode);
  if (!priceId) {
    throw new Error("Missing Paddle price configuration.");
  }

  await paddleRequest(
    `/subscriptions/${providerSubscriptionId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        proration_billing_mode: immediate
          ? "prorated_immediately"
          : "prorated_next_billing_period",
      }),
    }
  );
}

export async function cancelPaddleSubscription({
  providerSubscriptionId,
  effectiveFrom,
}: {
  providerSubscriptionId: string;
  effectiveFrom: "immediately" | "next_billing_period";
}) {
  await paddleRequest(
    `/subscriptions/${providerSubscriptionId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({
        effective_from: effectiveFrom,
      }),
    }
  );
}

export async function clearPaddleScheduledChange(providerSubscriptionId: string) {
  await paddleRequest(`/subscriptions/${providerSubscriptionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      scheduled_change: null,
    }),
  });
}

export async function updatePaddleSubscriptionCustomData({
  providerSubscriptionId,
  customData,
}: {
  providerSubscriptionId: string;
  customData: Record<string, unknown>;
}) {
  await paddleRequest(`/subscriptions/${providerSubscriptionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      custom_data: customData,
    }),
  });
}
