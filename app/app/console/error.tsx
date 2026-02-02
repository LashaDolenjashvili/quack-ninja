"use client";

import { useEffect } from "react";

type ConsoleErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ConsoleError({ error, reset }: ConsoleErrorProps) {
  useEffect(() => {
    console.error("[QuackNinja] Console error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border border-[#E6EEF7] bg-white p-8 text-center shadow-[0_12px_32px_rgba(11,18,32,0.08)]">
      <h2 className="text-xl font-semibold text-[#0B1220]">
        Something went wrong
      </h2>
      <p className="max-w-md text-sm text-[#5B6B82]">
        The console hit an unexpected error. Reload to try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-[#003C79] px-4 py-2 text-sm font-semibold text-white"
      >
        Reload Console
      </button>
    </div>
  );
}
