import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PaddleEvent = {
  data?: {
    user_id?: string;
    status?: "active" | "inactive" | "past_due" | "canceled";
    provider_customer_id?: string | null;
    provider_subscription_id?: string | null;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean | null;
  };
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing Supabase env", { status: 500 });
  }

  // TODO: Validate Paddle signature.
  let payload: PaddleEvent | null = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }
  if (!payload?.data) {
    return new Response("Invalid payload", { status: 400 });
  }

  const {
    user_id,
    status = "inactive",
    provider_customer_id,
    provider_subscription_id,
    current_period_end,
    cancel_at_period_end,
  } = payload.data;

  if (!user_id) {
    return new Response("Missing user_id", { status: 200 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  await supabase.from("subscriptions").upsert({
    user_id,
    provider: "paddle",
    provider_customer_id,
    provider_subscription_id,
    status,
    current_period_end,
    cancel_at_period_end: Boolean(cancel_at_period_end),
  });

  const nextPlan = status === "active" ? "pro" : "free";
  await supabase.from("profiles").update({ plan: nextPlan }).eq("id", user_id);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
