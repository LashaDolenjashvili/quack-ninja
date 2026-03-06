"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PaidPlanCode } from "@/src/billing/catalog";
import {
  ensurePaddleReady,
  isPaddleUnavailableError,
  openPaddleCheckout,
} from "@/src/billing/paddleClient";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { Button } from "@/src/components/ui/button";
import { buttonClassName } from "@/src/components/ui/button";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { usePlan } from "@/src/lib/usePlan";
import { CheckoutOptionsModal } from "@/src/components/billing/CheckoutOptionsModal";
import { useBillingSubscription } from "@/src/billing/useBillingSubscription";

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
  const { trial } = usePlan();
  const { data: billingData, refresh: refreshBilling } = useBillingSubscription();
  const [working, setWorking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!user || loading || !supabaseConfigured) {
      return;
    }
    void ensurePaddleReady().catch(() => undefined);
  }, [user, loading]);

  const activeSubscription =
    billingData?.subscription?.provider === "paddle"
      ? billingData.subscription
      : null;

  const openCheckoutWithFallback = async ({
    transactionId,
    checkoutUrl,
  }: {
    transactionId: string;
    checkoutUrl?: string | null;
  }) => {
    try {
      await openPaddleCheckout({ transactionId });
    } catch (error) {
      if (
        isPaddleUnavailableError(error) &&
        typeof window !== "undefined" &&
        typeof checkoutUrl === "string" &&
        checkoutUrl.length > 0
      ) {
        console.error(
          "[QuackNinja][Paddle] overlay unavailable, redirecting to hosted checkout",
          window.__quackPaddleDiag ?? []
        );
        window.location.assign(checkoutUrl);
        return;
      }
      throw error;
    }
  };

  const handleConfirm = async ({ autoRenew }: { autoRenew: boolean }) => {
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
      const response = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_plan_code: planCode,
          auto_renew: autoRenew,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            transaction_id?: string;
            checkout_url?: string | null;
            error?: string;
            message?: string;
            mode?: "checkout" | "updated" | "scheduled" | "switch_required";
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Checkout failed.");
      }
      if (payload?.mode === "switch_required" && payload.transaction_id) {
        const confirmed =
          typeof window === "undefined"
            ? true
            : window.confirm(
                `Switching plans requires canceling your current ${activeSubscription?.plan_code.replace(
                  "_",
                  " "
                )} plan first. It will end immediately and you may lose current limits until the new plan is purchased. Continue?`
              );
        if (!confirmed) {
          return;
        }

        await ensurePaddleReady();

        const cancelResponse = await fetch("/api/billing/manage-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "cancel_now" }),
        });
        const cancelPayload = (await cancelResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        if (!cancelResponse.ok) {
          throw new Error(cancelPayload?.error ?? "Failed to cancel the current plan.");
        }
        await refreshBilling();
        await openCheckoutWithFallback({
          transactionId: payload.transaction_id,
          checkoutUrl: payload.checkout_url,
        });
      } else if (payload?.mode === "checkout" && payload.transaction_id) {
        await openCheckoutWithFallback({
          transactionId: payload.transaction_id,
          checkoutUrl: payload.checkout_url,
        });
      } else if (payload?.message) {
        window.alert(payload.message);
      }
      setModalOpen(false);
    } catch (err) {
      if (typeof window !== "undefined" && isPaddleUnavailableError(err)) {
        console.error(
          "[QuackNinja][Paddle] checkout diagnostics",
          window.__quackPaddleDiag ?? []
        );
      }
      const message = isPaddleUnavailableError(err)
        ? "Checkout provider is still loading. Please refresh the page and try again."
        : err instanceof Error
          ? err.message
          : "Checkout failed.";
      window.alert(message);
    } finally {
      setWorking(false);
    }
  };

  const handleClick = async () => {
    if (!supabaseConfigured) {
      return;
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.push("/auth/sign-up");
      return;
    }
    setModalOpen(true);
    void ensurePaddleReady().catch(() => undefined);
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
    <>
      <Button
        type="button"
        onClick={() => void handleClick()}
        disabled={working || loading}
        fullWidth={fullWidth}
        className={className}
      >
        {working ? "Preparing..." : label}
      </Button>
      <CheckoutOptionsModal
        open={modalOpen}
        planCode={planCode}
        trialEndsAt={trial.active ? trial.endsAt : null}
        trialCountdown={
          trial.active && trial.serverNow && trial.endsAt
            ? (() => {
                const remainingMs =
                  new Date(trial.endsAt).getTime() -
                  new Date(trial.serverNow).getTime();
                if (remainingMs <= 0) {
                  return null;
                }
                if (remainingMs >= 24 * 60 * 60 * 1000) {
                  return `${Math.ceil(remainingMs / (24 * 60 * 60 * 1000))} days`;
                }
                if (remainingMs >= 60 * 60 * 1000) {
                  return `${Math.floor(remainingMs / (60 * 60 * 1000))} hours`;
                }
                return `${Math.max(1, Math.floor(remainingMs / (60 * 1000)))} minutes`;
              })()
            : null
        }
        working={working}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
