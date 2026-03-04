import Link from "next/link";
import { Logo } from "@/src/components/Logo";

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#002D5A] text-white">
      <div className="pointer-events-none absolute -left-20 top-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(9,206,164,0.16),rgba(9,206,164,0)_72%)] blur-3xl" />
      <div className="h-px w-full bg-gradient-to-r from-white/0 via-white/15 to-white/0" />

      <div className="qn-container relative py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center">
              <Logo showMark={false} showText />
            </div>
            <p className="max-w-md text-sm text-white/70">
              Run SQL on your files locally, validate fast, and export clean
              results without setting up a database.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:min-w-[420px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                Product
              </p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-white/80">
                <Link
                  href="/"
                  className="rounded-sm text-white/85 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Home
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-sm text-white/85 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Pricing
                </Link>
                <Link
                  href="/docs"
                  className="rounded-sm text-white/85 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Docs
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                Legal
              </p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-white/80">
                <Link
                  href="/terms-and-conditions"
                  className="rounded-sm text-white/85 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy-policy"
                  className="rounded-sm text-white/85 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Privacy
                </Link>
                <Link
                  href="/refund-policy"
                  className="rounded-sm text-white/85 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Refunds
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            <span className="text-white/60">Support</span>{" "}
            <span className="font-semibold text-white">support@quackninja.com</span>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <p>© {new Date().getFullYear()} QuackNinja</p>
            <p>Runs locally in your browser. Files stay on your device by default.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
