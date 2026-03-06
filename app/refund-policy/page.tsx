import type { Metadata } from "next";
import { LegalShell } from "@/src/components/layout/LegalShell";
import { LegalCard } from "@/src/components/legal/LegalCard";
import { LegalHeader } from "@/src/components/legal/LegalHeader";
import { LegalCallout } from "@/src/components/legal/LegalCallout";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Refund Policy",
  description: "Refund Policy for QuackNinja subscriptions.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <LegalShell>
      <LegalCard className="mx-auto w-full max-w-4xl space-y-8">
        <LegalHeader
          kicker="Refunds"
          title="Refund Policy"
          updatedAt="2026-02-03"
        />
        <LegalCallout>
          <p className="text-sm font-semibold text-[#0B1220]">Key points</p>
          <ul className="mt-2 space-y-2 text-sm text-[#0B1220]">
            <li>Refund window: 14 days</li>
            <li>How to request: support@quackninja.com</li>
            <li>Processed via Paddle</li>
          </ul>
        </LegalCallout>

        <section className="space-y-4 text-sm leading-relaxed text-slate-700">
          <p>
            If you’re not satisfied, request a refund within 14 days of
            purchase and we will issue it.
          </p>
          <p>
            Refunds are processed via Paddle.
          </p>
          <p>
            To request a refund, email{" "}
            <a
              href="mailto:support@quackninja.com"
              className="font-semibold text-[color:var(--color-primary)] underline underline-offset-4"
            >
              support@quackninja.com
            </a>
            .
          </p>
        </section>
      </LegalCard>
    </LegalShell>
  );
}
