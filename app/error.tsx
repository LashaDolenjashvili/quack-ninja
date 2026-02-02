"use client";

import { useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { logClientError } from "@/src/lib/logger";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logClientError(error, "Global error boundary");
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7FAFC] px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#E6EEF7] bg-white p-6 text-center shadow-[0_18px_48px_rgba(11,18,32,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
          Something went wrong
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[#0B1220]">
          We hit a snag
        </h1>
        <p className="mt-2 text-sm text-[#5B6B82]">
          Try reloading the page. If this keeps happening, refresh the browser.
        </p>
        <div className="mt-6 flex justify-center">
          <Button type="button" onClick={reset} variant="primary">
            Reload
          </Button>
        </div>
      </div>
    </div>
  );
}
