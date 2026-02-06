"use client";

import Link from "next/link";
import { BillingComingSoonNotice } from "@/src/components/BillingComingSoonNotice";
import { Button } from "@/src/components/ui/button";

export function BillingComingSoonPage({
  backHref = "/app/console",
}: {
  backHref?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <BillingComingSoonNotice />
      <div className="rounded-2xl border border-[#E6EEF7] bg-white/90 p-6 shadow-[0_18px_48px_rgba(11,18,32,0.08)]">
        <h1 className="text-2xl font-semibold text-[#0B1220]">
          Billing coming soon
        </h1>
        <p className="mt-2 text-sm text-[#5B6B82]">
          Payments are being enabled. Please check back soon.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" disabled className="cursor-not-allowed opacity-80">
            Pro — coming soon
          </Button>
          <Link
            href={backHref}
            className="inline-flex items-center justify-center rounded-lg border border-[#003C79] px-4 py-2 text-sm font-semibold text-[#003C79]"
          >
            Back to Console
          </Link>
        </div>
      </div>
    </div>
  );
}
