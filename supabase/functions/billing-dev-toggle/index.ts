import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ToggleRequest = {
  plan?: "free" | "pro";
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const bypass = Deno.env.get("DEV_BILLING_BYPASS") === "true";
  if (!bypass) {
    return new Response("Billing dev toggle disabled", { status: 403 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return new Response("Missing Supabase env", { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: ToggleRequest | null = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }
  const nextPlan = payload?.plan;
  if (nextPlan !== "free" && nextPlan !== "pro") {
    return new Response("Invalid plan", { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  await supabase.from("profiles").update({ plan: nextPlan }).eq("id", user.id);

  return new Response(JSON.stringify({ ok: true, plan: nextPlan }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
