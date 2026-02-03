import type { Metadata } from "next";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { MarketingFooter } from "@/src/components/layout/MarketingFooter";

export const metadata: Metadata = {
  title: "Terms and Conditions • QuackNinja",
  description:
    "Terms and Conditions for QuackNinja, including service details and payments.",
};

export default function TermsAndConditionsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#F7FAFC] text-[#0B1220]">
      <AppHeader variant="docs" />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 pb-16 pt-28">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Terms of Service</h1>
          <p className="text-sm text-[#5B6B82]">Last updated: 2026-02-03</p>
        </header>

        <section className="space-y-4 text-sm leading-6 text-[#0B1220]">
          <p>
            QuackNinja is operated by{" "}
            <a
              href="https://www.linkedin.com/in/lasha-dolenjashvili/"
              className="font-semibold text-[#003C79] underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              Lasha Dolenjashvili
            </a>
            .
          </p>

          <h2 className="text-lg font-semibold text-[#0B1220]">The Service</h2>
          <p>
            QuackNinja provides a browser-based workspace to run SQL on CSV,
            Excel (.xlsx), and Parquet exports. The product is designed for
            quick answers from real exports and runs locally in your browser.
          </p>

          <h2 className="text-lg font-semibold text-[#0B1220]">Accounts</h2>
          <p>
            You are responsible for activity on your account and for keeping
            your login credentials secure. Please provide accurate information
            and keep your account up to date.
          </p>

          <h2 className="text-lg font-semibold text-[#0B1220]">
            Privacy &amp; Local Files
          </h2>
          <p>
            QuackNinja is designed to keep your files on your computer during
            normal use. We do not upload file contents by default.
          </p>

          <h2 className="text-lg font-semibold text-[#0B1220]">
            Payments &amp; Subscriptions
          </h2>
          <p>
            Payments and subscriptions are billed via Paddle. Subscription
            access is tied to your account and renews based on the plan you
            select unless you cancel.
          </p>

          <h2 className="text-lg font-semibold text-[#0B1220]">Refunds</h2>
          <p>
            Refund terms are described in our{" "}
            <a
              href="/refund-policy"
              className="font-semibold text-[#003C79] underline underline-offset-4"
            >
              Refund Policy
            </a>
            .
          </p>

          <h2 className="text-lg font-semibold text-[#0B1220]">Changes</h2>
          <p>
            We may update these terms from time to time. If we make material
            changes, we will update the “Last updated” date above.
          </p>

          <h2 className="text-lg font-semibold text-[#0B1220]">Contact</h2>
          <p>
            Questions? Email{" "}
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
