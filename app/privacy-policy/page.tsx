import type { Metadata } from "next";
import { LegalShell } from "@/src/components/layout/LegalShell";
import { LegalCard } from "@/src/components/legal/LegalCard";
import { LegalHeader } from "@/src/components/legal/LegalHeader";
import { LegalTOC } from "@/src/components/legal/LegalTOC";

export const metadata: Metadata = {
  title: "Privacy Policy • QuackNinja",
  description:
    "Privacy Policy for QuackNinja, including account data and local files.",
  alternates: {
    canonical: "https://www.quackninja.com/privacy-policy",
  },
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
            { id: "privacy-at-a-glance", label: "Privacy at a glance" },
            { id: "what-we-collect", label: "What we collect" },
            { id: "what-we-do-not-upload", label: "What we do not upload" },
            { id: "how-we-use-your-information", label: "How we use your information" },
            { id: "third-party-services", label: "Third-party services" },
            { id: "data-retention", label: "Data retention" },
            { id: "your-choices-rights", label: "Your choices & rights" },
            { id: "security", label: "Security" },
            { id: "updates-to-this-policy", label: "Updates to this policy" },
            { id: "contact", label: "Contact" },
          ]}
        />
        <section className="space-y-4 text-sm leading-relaxed text-slate-700">
          <h2 id="privacy-at-a-glance" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Privacy at a glance
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Your files stay on your device by default. We do not upload or
              store your raw file contents during normal use.
            </li>
            <li>
              We collect account information such as your email address and
              basic account metadata to provide the service.
            </li>
            <li>
              We may collect limited product telemetry, including feature usage
              signals and error diagnostics, to improve reliability.
            </li>
            <li>
              Payments are processed by Paddle. We receive billing metadata, but
              we do not store full payment details such as card numbers.
            </li>
            <li>
              We use Supabase for authentication and account storage.
            </li>
          </ul>

          <h2 id="what-we-collect" className="text-lg font-semibold text-[color:var(--text-primary)]">
            What we collect
          </h2>
          <p>We may collect:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Account information: your email address and basic account
              metadata, such as plan status.
            </li>
            <li>
              Billing metadata (via Paddle): subscription status, transaction
              identifiers, and invoice or receipt metadata.
            </li>
            <li>
              Product telemetry (limited): feature usage signals and error
              diagnostics used to improve performance, reliability, and bug
              fixes.
            </li>
          </ul>
          <p>We do not sell your personal data.</p>

          <h2 id="what-we-do-not-upload" className="text-lg font-semibold text-[color:var(--text-primary)]">
            What we do not upload
          </h2>
          <p>
            During normal use, QuackNinja runs locally in your browser.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Raw file contents are not uploaded to our servers by default.</li>
            <li>Queries run against your local files in-session.</li>
          </ul>
          <p>
            If we introduce a feature that requires uploads in the future, such
            as cloud sync or collaboration, we will make that explicit and
            opt-in, and we will update this policy to explain what is uploaded
            and why.
          </p>

          <h2 id="how-we-use-your-information" className="text-lg font-semibold text-[color:var(--text-primary)]">
            How we use your information
          </h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>create and manage your account</li>
            <li>provide paid plans and billing status</li>
            <li>troubleshoot errors and improve product reliability</li>
            <li>respond to support requests</li>
          </ul>

          <h2 id="third-party-services" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Third-party services (subprocessors)
          </h2>
          <p>We use trusted vendors to operate the service:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Supabase: authentication and storage of account data, including
              login and plan-related account records.
            </li>
            <li>
              Paddle: payment processing and subscription management. We receive
              billing metadata, not full payment credentials.
            </li>
          </ul>
          <p>
            These providers process data on our behalf to deliver QuackNinja.
          </p>

          <h2 id="data-retention" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Data retention
          </h2>
          <p>
            We retain account and billing metadata for as long as your account
            is active, and as needed for providing the service, legal or
            compliance obligations, security, and fraud prevention.
          </p>
          <p>
            You can request account deletion as described below.
          </p>

          <h2 id="your-choices-rights" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Your choices &amp; rights
          </h2>
          <p>You may:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>request access to your account data</li>
            <li>request correction of your account data</li>
            <li>request deletion of your account data</li>
            <li>ask questions about what we collect and why</li>
          </ul>
          <p>
            Depending on where you live, you may have additional rights under
            applicable privacy laws.
          </p>

          <h2 id="security" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Security
          </h2>
          <p>
            We use reasonable administrative and technical safeguards to protect
            account data. No method of transmission or storage is 100% secure,
            but we work to protect your information.
          </p>

          <h2 id="updates-to-this-policy" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Updates to this policy
          </h2>
          <p>
            We may update this policy from time to time. We will change the
            “Last updated” date when we do.
          </p>

          <h2 id="contact" className="text-lg font-semibold text-[color:var(--text-primary)]">
            Contact
          </h2>
          <p>
            To request changes or deletion, or if you have questions, email{" "}
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
