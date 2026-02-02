import { NextResponse } from "next/server";
import { getSupabaseAdmin, supabaseAdminConfigured } from "@/src/lib/supabaseServer";
import { TRIAL_ENABLED_SERVER, getTrialWindow } from "@/src/lib/trial";

export async function POST(request: Request) {
  if (!supabaseAdminConfigured) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, trial_consumed, trial_started_at, trial_ends_at")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!TRIAL_ENABLED_SERVER) {
    if (!profile) {
      await supabase.from("profiles").insert({
        id: authData.user.id,
        email: authData.user.email ?? null,
        plan: "free",
      });
    }
    return NextResponse.json({ ok: true, trial_enabled: false });
  }

  if (profile?.trial_consumed || profile?.trial_ends_at) {
    return NextResponse.json({ ok: true, trial_enabled: true, trial_started_at: profile?.trial_started_at ?? null, trial_ends_at: profile?.trial_ends_at ?? null });
  }

  const window = getTrialWindow(new Date());
  if (profile) {
    await supabase
      .from("profiles")
      .update({
        trial_started_at: window.startedAt,
        trial_ends_at: window.endsAt,
        trial_consumed: true,
      })
      .eq("id", authData.user.id);
  } else {
    await supabase.from("profiles").insert({
      id: authData.user.id,
      email: authData.user.email ?? null,
      plan: "free",
      trial_started_at: window.startedAt,
      trial_ends_at: window.endsAt,
      trial_consumed: true,
    });
  }

  return NextResponse.json({
    ok: true,
    trial_enabled: true,
    trial_started_at: window.startedAt,
    trial_ends_at: window.endsAt,
  });
}
