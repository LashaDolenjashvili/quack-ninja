import type { Metadata } from "next";
import { Logo } from "@/src/components/Logo";
import { AppHeader } from "@/src/components/layout/AppHeader";

export const metadata: Metadata = {
  title: "Terms of Service • QuackNinja",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#003C79] via-[#00356b] to-[#001f40] text-white">
      <AppHeader variant="docs" />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-16 pt-28">
        <div className="flex items-center">
          <Logo showText />
        </div>
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Terms of Service</h1>
          <p className="text-sm text-white/80">Last updated: 2026-02-03</p>
        </header>

        <section className="space-y-4 text-sm leading-6 text-white/90">
          <h2 className="text-lg font-semibold text-white">The Service</h2>
          <p>
            QuackNinja provides a browser-based workspace to run SQL on your
            own exports. We aim to keep the experience simple, fast, and local
            to your device.
          </p>

          <h2 className="text-lg font-semibold text-white">Accounts</h2>
          <p>
            You are responsible for the activity on your account and for
            keeping your login credentials secure. Please provide accurate
            information and keep your account up to date.
          </p>

          <h2 className="text-lg font-semibold text-white">
            Privacy &amp; Local Files
          </h2>
          <p>
            QuackNinja is designed to work locally in your browser. Your files
            stay on your computer unless you choose to share them. We do not
            upload file contents as part of normal use.
          </p>

          <h2 className="text-lg font-semibold text-white">
            Subscriptions &amp; Trials
          </h2>
          <p>
            We may offer paid plans and free trials. Trial access starts when
            you create an account and ends automatically after the stated
            period. Subscriptions renew according to the plan you choose unless
            you cancel.
          </p>

          <h2 className="text-lg font-semibold text-white">Acceptable Use</h2>
          <p>
            Do not misuse the service, attempt to disrupt it, or use it for
            unlawful activity. We may suspend accounts that violate these
            terms.
          </p>

          <h2 className="text-lg font-semibold text-white">Disclaimers</h2>
          <p>
            The service is provided “as is” without warranties of any kind. We
            do not guarantee uninterrupted or error-free operation.
          </p>

          <h2 className="text-lg font-semibold text-white">
            Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, QuackNinja will not be
            liable for indirect, incidental, or consequential damages arising
            from your use of the service.
          </p>

          <h2 className="text-lg font-semibold text-white">Changes</h2>
          <p>
            We may update these terms from time to time. If we make material
            changes, we will update the “Last updated” date above.
          </p>

          <h2 className="text-lg font-semibold text-white">Contact</h2>
          <p>
            Questions? Email{" "}
            <a
              href="mailto:support@quackninja.com"
              className="font-semibold text-white underline underline-offset-4"
            >
              support@quackninja.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
