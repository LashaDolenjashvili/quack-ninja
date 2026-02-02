import { NextResponse } from "next/server";
import { getSupabaseAdmin, supabaseAdminConfigured } from "@/src/lib/supabaseServer";

type SetPlanPayload = {
  user_id: string;
  plan: "free" | "pro";
};

function parsePayload(payload: unknown): SetPlanPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const maybe = payload as { user_id?: unknown; plan?: unknown };
  if (typeof maybe.user_id !== "string") {
    return null;
  }
  if (maybe.plan !== "free" && maybe.plan !== "pro") {
    return null;
  }
  return { user_id: maybe.user_id, plan: maybe.plan };
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
      { error: "Server not configured for admin actions." },
      { status: 500 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: authData, error: authError } = await supabase.auth.getUser(
    token
  );

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: adminProfile, error: adminProfileError } = await supabase
    .from("profiles")
    .select("id, email, plan, is_admin")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (adminProfileError || !adminProfile?.is_admin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const payload = parsePayload(await request.json().catch(() => null));
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { data: currentProfile, error: currentError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", payload.user_id)
    .maybeSingle();

  if (currentError || !currentProfile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({ plan: payload.plan })
    .eq("id", payload.user_id)
    .select("id, email, plan, is_admin")
    .maybeSingle();

  if (updateError || !updatedProfile) {
    return NextResponse.json({ error: "Failed to update plan." }, { status: 500 });
  }

  if (currentProfile.plan !== updatedProfile.plan) {
    await supabase.from("plan_change_audit").insert({
      changed_by: authData.user.id,
      changed_user: updatedProfile.id,
      from_plan: currentProfile.plan,
      to_plan: updatedProfile.plan,
    });
  }

  return NextResponse.json({ profile: updatedProfile });
}
