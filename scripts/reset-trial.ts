import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const emailArg = process.argv.find((arg) => arg.startsWith("--email="));
const idArg = process.argv.find((arg) => arg.startsWith("--id="));

const email = emailArg ? emailArg.split("=")[1] : null;
const id = idArg ? idArg.split("=")[1] : null;

if (!email && !id) {
  throw new Error("Provide --email=you@example.com or --id=uuid");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const query = supabase.from("profiles").update({
    trial_started_at: null,
    trial_ends_at: null,
    trial_consumed: false,
  });

  const { error } = email ? await query.eq("email", email) : await query.eq("id", id!);
  if (error) {
    throw error;
  }
  console.log("Trial reset complete");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
