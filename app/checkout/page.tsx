"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { openPaddleCheckout } from "@/src/billing/paddleClient";
import { Button } from "@/src/components/ui/button";

function getTransactionIdFromSearch(searchParams: URLSearchParams) {
  const value = searchParams.get("_ptxn") ?? searchParams.get("transaction_id");
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const attemptedRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const transactionId = getTransactionIdFromSearch(searchParams);

  useEffect(() => {
    if (!transactionId) {
      setError("Missing checkout transaction. Please go back and try again.");
      return;
    }
    if (attemptedRef.current === transactionId) {
      return;
    }
    attemptedRef.current = transactionId;
    setError(null);

    void (async () => {
      try {
        await openPaddleCheckout({ transactionId });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to open checkout. Please refresh and try again.";
        setError(message);
      }
    })();
  }, [transactionId]);

  const retry = () => {
    if (!transactionId) {
      return;
    }
    attemptedRef.current = null;
    setError(null);
  };

  return (
    <main className="min-h-screen bg-[#F5F8FC] px-6 py-16">
      <section className="mx-auto w-full max-w-xl rounded-3xl border border-[#D9E3F0] bg-white px-8 py-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#09A483]">
          Secure checkout
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0B1220]">
          Opening Paddle checkout
        </h1>
        <p className="mt-3 text-sm text-[#5B6B82]">
          Please wait while we launch your payment window.
        </p>

        {error ? (
          <div className="mt-5 rounded-xl border border-[#F7C7C7] bg-[#FFF5F5] px-4 py-3 text-sm text-[#8A1C1C]">
            <p>{error}</p>
            <Button
              type="button"
              variant="secondary"
              className="mt-3"
              onClick={retry}
            >
              Retry checkout
            </Button>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3 text-sm text-[#5B6B82]">
            If no popup appears, allow popups for this site and click Retry.
          </div>
        )}
      </section>
    </main>
  );
}
