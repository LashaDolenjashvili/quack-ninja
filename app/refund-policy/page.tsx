import type { Metadata } from "next";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { MarketingFooter } from "@/src/components/layout/MarketingFooter";

export const metadata: Metadata = {
  title: "Refund Policy • QuackNinja",
  description: "Refund Policy for QuackNinja subscriptions.",
};

export default function RefundPolicyPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#F7FAFC] text-[#0B1220]">
      <AppHeader variant="docs" />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 pb-16 pt-28">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Refund Policy</h1>
          <p className="text-sm text-[#5B6B82]">Last updated: 2026-02-03</p>
        </header>

        <section className="space-y-4 text-sm leading-6 text-[#0B1220]">
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
              className="font-semibold text-[#003C79] underline underline-offset-4"
            >
              support@quackninja.com
            </a>
            .
          </p>
        </section>
      </div>
      <MarketingFooter />
    </main>
  );
}
