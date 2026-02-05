"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banner } from "@/src/components/ui/banner";
import { Button } from "@/src/components/ui/button";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { logClientError } from "@/src/lib/logger";
import Link from "next/link";

type AuthMode = "sign-in" | "sign-up";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!supabaseConfigured) {
        setError("Supabase is not configured. Check env vars.");
        return;
      }

      if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          throw signUpError;
        }
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: data.user.email ?? email,
            plan: "free",
          });
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          throw signInError;
        }
      }

      if (mode === "sign-up") {
        const emailParam = email ? `&email=${encodeURIComponent(email)}` : "";
        router.replace(`/auth/sign-in?notice=confirm_email${emailParam}`);
        return;
      }
      router.replace("/app/console");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authentication failed.";
      const cleanMessage =
        mode === "sign-in" && message.toLowerCase().includes("invalid")
          ? "Email or password is incorrect."
          : message;
      logClientError(err, "Auth failed");
      setError(cleanMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="text-sm font-semibold text-[color:var(--text-primary)]">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-[color:var(--text-primary)] shadow-[0_10px_24px_rgba(2,6,23,0.08)] focus:outline-none focus:ring-2 focus:ring-[#09CEA4]/70"
          required
        />
      </label>
      <label className="text-sm font-semibold text-[color:var(--text-primary)]">
        Password
        <div className="relative mt-2">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-[color:var(--border)] bg-white/90 px-4 py-3 pr-16 text-sm text-[color:var(--text-primary)] shadow-[0_10px_24px_rgba(2,6,23,0.08)] focus:outline-none focus:ring-2 focus:ring-[#09CEA4]/70"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-[color:var(--color-primary)] hover:text-[#002f60]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </label>
      {mode === "sign-in" ? (
        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-xs font-semibold text-[color:var(--color-primary)] hover:text-[#002f60]"
          >
            Forgot password?
          </Link>
        </div>
      ) : null}
      {error ? (
        <Banner tone="warning">{error}</Banner>
      ) : null}
      <Button type="submit" disabled={loading} aria-busy={loading}>
        {loading
          ? mode === "sign-up"
            ? "Creating account..."
            : "Signing in..."
          : mode === "sign-up"
            ? "Create account"
            : "Sign in"}
      </Button>
    </form>
  );
}
