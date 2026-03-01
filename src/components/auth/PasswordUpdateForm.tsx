"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Banner } from "@/src/components/ui/banner";
import { Button } from "@/src/components/ui/button";
import { logClientError } from "@/src/lib/logger";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { useAuth } from "@/src/components/auth/AuthProvider";

export function PasswordUpdateForm() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading || !supabaseConfigured) {
      return;
    }
    if (!session) {
      setError("This reset link is invalid or has expired. Request a new one.");
    }
  }, [authLoading, session]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!supabaseConfigured) {
      setError("Supabase is not configured. Check env vars.");
      return;
    }
    if (!session) {
      setError("This reset link is invalid or has expired. Request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        throw updateError;
      }
      setNotice("Password updated. Please sign in with your new password.");
      const { error: signOutError } = await supabase.auth.signOut({
        scope: "local",
      });
      if (
        signOutError &&
        !/refresh token not found|invalid refresh token/i.test(signOutError.message)
      ) {
        throw signOutError;
      }
      window.setTimeout(() => {
        router.replace("/auth/sign-in?notice=password_reset");
      }, 600);
    } catch (err) {
      logClientError(err, "Password update failed");
      setError("We couldn’t update your password. Request a new reset link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="text-sm font-semibold text-[color:var(--text-primary)]">
        New password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-[color:var(--text-primary)] shadow-[0_10px_24px_rgba(2,6,23,0.08)] focus:outline-none focus:ring-2 focus:ring-[#09CEA4]/70"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <label className="text-sm font-semibold text-[color:var(--text-primary)]">
        Confirm new password
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-[color:var(--text-primary)] shadow-[0_10px_24px_rgba(2,6,23,0.08)] focus:outline-none focus:ring-2 focus:ring-[#09CEA4]/70"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      {notice ? <Banner tone="success">{notice}</Banner> : null}
      {error ? <Banner tone="warning">{error}</Banner> : null}
      <Button
        type="submit"
        disabled={submitting || !session}
        aria-busy={submitting}
      >
        {submitting ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
