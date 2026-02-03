import type { Metadata } from "next";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { MarketingFooter } from "@/src/components/layout/MarketingFooter";

export const metadata: Metadata = {
  title: "Privacy Policy • QuackNinja",
  description:
    "Privacy Policy for QuackNinja, including account data and local files.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#F7FAFC] text-[#0B1220]">
      <AppHeader variant="docs" />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 pb-16 pt-28">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Privacy Policy</h1>
          <p className="text-sm text-[#5B6B82]">Last updated: 2026-02-03</p>
        </header>

        <section className="space-y-4 text-sm leading-6 text-[#0B1220]">
          <h2 className="text-lg font-semibold text-[#0B1220]">What we collect</h2>
          <p>
            We collect your account email, basic account metadata, and billing
            metadata from Paddle. We may collect basic product telemetry such as
            feature usage and errors to improve the service.
          </p>

          <h2 className="text-lg font-semibold text-[#0B1220]">
            What we do not upload
          </h2>
          <p>
            Your files stay on your computer during normal use. We do not
            upload file contents by default.
          </p>

          <h2 className="text-lg font-semibold text-[#0B1220]">Supabase usage</h2>
          <p>
            We use Supabase for authentication and account data storage. Your
            login and plan information is stored securely in Supabase.
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
