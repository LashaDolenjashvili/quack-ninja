import { NextResponse } from "next/server";
import {
  getPaddlePriceIdForPlanCode,
  getSuccessUrl,
  isPaidPlanCode,
} from "@/src/billing/catalog";
import { getSupabaseAdmin, supabaseAdminConfigured } from "@/src/lib/supabaseServer";

type CheckoutSessionPayload = {
  plan_code: string;
  auto_renew: boolean;
};

type PaddleTransactionResponse = {
  data?: {
    id?: string;
  };
  error?: {
    detail?: string;
  };
};

function getPaddleBaseUrl() {
  return process.env.PADDLE_ENV === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

function parsePayload(payload: unknown): CheckoutSessionPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const maybe = payload as { plan_code?: unknown; auto_renew?: unknown };
  if (typeof maybe.plan_code !== "string" || typeof maybe.auto_renew !== "boolean") {
    return null;
  }
  return { plan_code: maybe.plan_code, auto_renew: maybe.auto_renew };
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
  if (!payload || !isPaidPlanCode(payload.plan_code)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const priceId = getPaddlePriceIdForPlanCode(payload.plan_code);
  if (!priceId) {
    return NextResponse.json(
      { error: "Missing Paddle price configuration." },
      { status: 500 }
    );
  }

  const paddleApiKey = process.env.PADDLE_API_KEY ?? "";
  if (!paddleApiKey) {
    return NextResponse.json(
      { error: "Missing Paddle API key." },
      { status: 500 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_started_at, trial_ends_at")
    .eq("id", authData.user.id)
    .maybeSingle<{
      trial_started_at: string | null;
      trial_ends_at: string | null;
    }>();

  const nowMs = Date.now();
  const trialEndsAt = profile?.trial_ends_at ?? null;
  const trialActive = Boolean(
    trialEndsAt && new Date(trialEndsAt).getTime() > nowMs
  );
  const trialRemainingSeconds = trialActive
    ? Math.max(
        0,
        Math.ceil((new Date(trialEndsAt as string).getTime() - nowMs) / 1000)
      )
    : 0;

  const requestBody: Record<string, unknown> = {
    items: [{ price_id: priceId, quantity: 1 }],
    customer_email: authData.user.email ?? undefined,
    collection_mode: "automatic",
    custom_data: {
      user_id: authData.user.id,
      plan_code: payload.plan_code,
      auto_renew: payload.auto_renew,
      trial_ends_at: trialActive ? trialEndsAt : null,
      trial_remaining_seconds: trialRemainingSeconds,
    },
    checkout: {
      success_url: getSuccessUrl(),
    },
  };

  if (trialActive) {
    requestBody.discount = {
      description: "Remaining QuackNinja trial",
      type: "percentage",
      amount: "100",
      recur: false,
    };
  }

  const response = await fetch(`${getPaddleBaseUrl()}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paddleApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const data = (await response.json().catch(() => null)) as PaddleTransactionResponse | null;

  if (!response.ok || !data?.data?.id) {
    return NextResponse.json(
      {
        error:
          data?.error?.detail ??
          "Unable to create Paddle checkout transaction.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    transaction_id: data.data.id,
    trial_active: trialActive,
    trial_ends_at: trialEndsAt,
  });
}
