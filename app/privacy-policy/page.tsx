import type { Metadata } from "next";
import { LegalShell } from "@/src/components/layout/LegalShell";
import { LegalCard } from "@/src/components/legal/LegalCard";
import { LegalHeader } from "@/src/components/legal/LegalHeader";
import { LegalTOC } from "@/src/components/legal/LegalTOC";

export const metadata: Metadata = {
  title: "Privacy Policy • QuackNinja",
  description:
    "Privacy Policy for QuackNinja, including account data and local files.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalShell>
      <LegalCard className="mx-auto w-full max-w-4xl space-y-8">
        <LegalHeader
          kicker="Privacy"
          title="Privacy Policy"
          updatedAt="2026-02-03"
        />
        <LegalTOC
          items={[
            { id: "what-we-collect", label: "What we collect" },
            { id: "what-we-do-not-upload", label: "What we do not upload" },
            { id: "supabase-usage", label: "Supabase usage" },
            { id: "contact", label: "Contact" },
          ]}
        />
        <section className="space-y-4 text-sm leading-relaxed text-slate-700">
          <h2 id="what-we-collect" className="text-lg font-semibold text-[color:var(--text-primary)]">
            What we collect
          </h2>
          <p>
            We collect your account email, basic account metadata, and billing
            metadata from Paddle. We may collect basic product telemetry such as
            feature usage and errors to improve the service.
          </p>

          <h2 id="what-we-do-not-upload" className="text-lg font-semibold text-[color:var(--text-primary)]">
            What we do not upload
          </h2>
          <p>
            Your files stay on your computer during normal use. We do not
            upload file contents by default.
          </p>

          <h2 id="supabase-usage" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Supabase usage
          </h2>
          <p>
            We use Supabase for authentication and account data storage. Your
            login and plan information is stored securely in Supabase.
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
