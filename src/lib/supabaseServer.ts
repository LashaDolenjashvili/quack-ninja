import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseAdminConfigured = Boolean(
  supabaseUrl && serviceRoleKey
);

export function getSupabaseAdmin() {
  if (!supabaseAdminConfigured) {
    throw new Error("Supabase admin client is not configured.");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
