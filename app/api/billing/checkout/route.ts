import { NextResponse } from "next/server";
import {
  getCancelUrl,
  getPaddlePriceIdForPlanCode,
  getSuccessUrl,
  isPaidPlanCode,
} from "@/src/billing/catalog";
import { getSupabaseAdmin, supabaseAdminConfigured } from "@/src/lib/supabaseServer";

type CheckoutPayload = {
  plan_code: string;
};

function parsePayload(payload: unknown): CheckoutPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const maybe = payload as { plan_code?: unknown };
  if (typeof maybe.plan_code !== "string") {
    return null;
  }
  return { plan_code: maybe.plan_code };
}

function getPaddleBaseUrl() {
  return process.env.PADDLE_ENV === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
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

  const requestBody = {
    items: [{ price_id: priceId, quantity: 1 }],
    customer_email: authData.user.email ?? undefined,
    custom_data: {
      user_id: authData.user.id,
      plan_code: payload.plan_code,
    },
    settings: {
      success_url: getSuccessUrl(),
      cancel_url: getCancelUrl(),
    },
  };

  const response = await fetch(`${getPaddleBaseUrl()}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paddleApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const data = (await response.json().catch(() => null)) as
    | {
        data?: {
          url?: string | null;
        };
        error?: {
          detail?: string;
        };
      }
    | null;

  if (!response.ok || !data?.data?.url) {
    return NextResponse.json(
      {
        error:
          data?.error?.detail ??
          "Unable to create Paddle checkout session.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ checkout_url: data.data.url });
}
