import type { Metadata } from "next";
import { LegalShell } from "@/src/components/layout/LegalShell";
import { LegalCard } from "@/src/components/legal/LegalCard";
import { LegalHeader } from "@/src/components/legal/LegalHeader";
import { LegalTOC } from "@/src/components/legal/LegalTOC";

export const metadata: Metadata = {
  title: "Terms and Conditions • QuackNinja",
  description:
    "Terms and Conditions for QuackNinja, including service details and payments.",
};

export default function TermsAndConditionsPage() {
  return (
    <LegalShell>
      <LegalCard className="mx-auto w-full max-w-4xl space-y-8">
        <LegalHeader
          kicker="Terms"
          title="Terms of Service"
          updatedAt="2026-02-03"
        />
        <LegalTOC
          items={[
            { id: "the-service", label: "The Service" },
            { id: "accounts", label: "Accounts" },
            { id: "privacy-local-files", label: "Privacy & Local Files" },
            { id: "payments-subscriptions", label: "Payments & Subscriptions" },
            { id: "refunds", label: "Refunds" },
            { id: "changes", label: "Changes" },
            { id: "contact", label: "Contact" },
          ]}
        />
        <section className="space-y-4 text-sm leading-relaxed text-slate-700">
          <p>
            QuackNinja is operated by{" "}
            <a
              href="https://www.linkedin.com/in/lasha-dolenjashvili/"
              className="font-semibold text-[color:var(--color-primary)] underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              Lasha Dolenjashvili
            </a>
            .
          </p>

          <h2 id="the-service" className="text-lg font-semibold text-[color:var(--text-primary)]">
            The Service
          </h2>
          <p>
            QuackNinja provides a browser-based workspace to run DuckDB SQL on
            CSV, Excel (.xlsx), and Parquet exports. The product is designed
            for quick answers from real exports and runs locally in your
            browser.
          </p>

          <h2 id="accounts" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Accounts
          </h2>
          <p>
            You are responsible for activity on your account and for keeping
            your login credentials secure. Please provide accurate information
            and keep your account up to date.
          </p>

          <h2 id="privacy-local-files" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Privacy &amp; Local Files
          </h2>
          <p>
            QuackNinja is designed to keep your files on your computer during
            normal use. We do not upload file contents by default.
          </p>

          <h2 id="payments-subscriptions" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Payments &amp; Subscriptions
          </h2>
          <p>
            Payments and subscriptions are billed via Paddle. Subscription
            access is tied to your account and renews based on the plan you
            select unless you cancel.
          </p>

          <h2 id="refunds" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Refunds
          </h2>
          <p>
            Refund terms are described in our{" "}
            <a
              href="/refund-policy"
              className="font-semibold text-[color:var(--color-primary)] underline underline-offset-4"
            >
              Refund Policy
            </a>
            .
          </p>

          <h2 id="changes" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Changes
          </h2>
          <p>
            We may update these terms from time to time. If we make material
            changes, we will update the “Last updated” date above.
          </p>

          <h2 id="contact" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Contact
          </h2>
          <p>
            Questions? Email{" "}
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
