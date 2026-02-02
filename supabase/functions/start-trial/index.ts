import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TRIAL_DAYS = 7;
const TRIAL_DURATION_SECONDS = Number(Deno.env.get("TRIAL_DURATION_SECONDS"));

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const trialEnabled = Deno.env.get("TRIAL_ENABLED") === "true";
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

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, plan, trial_consumed, trial_started_at, trial_ends_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!trialEnabled) {
    if (!profile) {
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email ?? null,
        plan: "free",
      });
    }
    return new Response(
      JSON.stringify({ ok: true, trial_enabled: false }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (profile?.trial_consumed || profile?.trial_ends_at) {
    return new Response(
      JSON.stringify({
        ok: true,
        trial_enabled: true,
        trial_started_at: profile?.trial_started_at ?? null,
        trial_ends_at: profile?.trial_ends_at ?? null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const now = new Date();
  const durationMs =
    Number.isFinite(TRIAL_DURATION_SECONDS) && TRIAL_DURATION_SECONDS > 0
      ? TRIAL_DURATION_SECONDS * 1000
      : TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const endsAt = new Date(now.getTime() + durationMs);
  if (profile) {
    await supabase
      .from("profiles")
      .update({
        trial_started_at: now.toISOString(),
        trial_ends_at: endsAt.toISOString(),
        trial_consumed: true,
      })
      .eq("id", user.id);
  } else {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email ?? null,
      plan: "free",
      trial_started_at: now.toISOString(),
      trial_ends_at: endsAt.toISOString(),
      trial_consumed: true,
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      trial_enabled: true,
      trial_started_at: now.toISOString(),
      trial_ends_at: endsAt.toISOString(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
