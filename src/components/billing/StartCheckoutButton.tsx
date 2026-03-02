"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PaidPlanCode } from "@/src/billing/catalog";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { Button } from "@/src/components/ui/button";
import { buttonClassName } from "@/src/components/ui/button";
import { useAuth } from "@/src/components/auth/AuthProvider";

type StartCheckoutButtonProps = {
  planCode: PaidPlanCode;
  label: string;
  className?: string;
  fullWidth?: boolean;
};

export function StartCheckoutButton({
  planCode,
  label,
  className,
  fullWidth = false,
}: StartCheckoutButtonProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [working, setWorking] = useState(false);

  const handleClick = async () => {
    if (!supabaseConfigured) {
      return;
    }
    setWorking(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.push("/auth/sign-up");
        return;
      }
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan_code: planCode }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { checkout_url?: string; error?: string }
        | null;
      if (!response.ok || !payload?.checkout_url) {
        throw new Error(payload?.error ?? "Checkout failed.");
      }
      window.location.href = payload.checkout_url;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Checkout failed.";
      window.alert(message);
    } finally {
      setWorking(false);
    }
  };

  if (!user && !loading) {
    return (
      <Link
        href="/auth/sign-up"
        className={buttonClassName({
          fullWidth,
          className,
        })}
      >
        {label}
      </Link>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => void handleClick()}
      disabled={working || loading}
      fullWidth={fullWidth}
      className={className}
    >
      {working ? "Redirecting..." : label}
    </Button>
  );
}
