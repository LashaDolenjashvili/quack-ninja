"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Banner } from "@/src/components/ui/banner";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { logClientError } from "@/src/lib/logger";

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      if (!supabaseConfigured) {
        setError("Supabase is not configured. Check env vars.");
        return;
      }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email
      );
      if (resetError) {
        throw resetError;
      }
      setNotice("Check your email for a reset link.");
    } catch (err) {
      logClientError(err, "Password reset failed");
      setError("We couldn’t send the reset email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="text-sm font-semibold text-[#0B1220]">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[#E6EEF7] bg-white px-3 py-2 text-sm text-[#0B1220] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#09CEA4]"
          required
        />
      </label>
      {notice ? <Banner tone="success">{notice}</Banner> : null}
      {error ? <Banner tone="warning">{error}</Banner> : null}
      <Button type="submit" disabled={loading} aria-busy={loading}>
        {loading ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
