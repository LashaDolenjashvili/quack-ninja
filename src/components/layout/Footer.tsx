import Link from "next/link";
import { Logo } from "@/src/components/Logo";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#002D5A] text-white">
      <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(9,206,164,0.18),rgba(9,206,164,0)_70%)] blur-2xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-white/6 blur-3xl" />
      <div className="h-px w-full bg-gradient-to-r from-white/0 via-white/20 to-white/0" />

      <div className="qn-container relative py-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div className="flex flex-col gap-4">
            <div className="w-fit rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Logo showMark={false} showText />
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/75">
              SQL on CSV, Excel, and Parquet in your browser. Start free, then
              upgrade when you need bigger files, exports, or team limits.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                Local-first
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                No install
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                Runs with DuckDB
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Product
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/50">
              Explore the core product, pricing, and docs.
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/80">
              <Link
                href="/"
                className="rounded-sm underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Home
              </Link>
              <Link
                href="/pricing"
                className="rounded-sm underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="rounded-sm underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Docs
              </Link>
              <Link
                href="/app/console"
                className="rounded-sm underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Console
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Legal
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/50">
              Policies, privacy, and billing terms.
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/80">
              <Link
                href="/terms-and-conditions"
                className="rounded-sm underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Terms
              </Link>
              <Link
                href="/privacy-policy"
                className="rounded-sm underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Privacy
              </Link>
              <Link
                href="/refund-policy"
                className="rounded-sm underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Refunds
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Support
            </p>
            <p className="mt-3 text-base font-semibold text-white">
              support@quackninja.com
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Questions about billing, account access, imports, or product
              usage.
            </p>
            <Link
              href="/privacy-policy"
              className="mt-4 inline-flex rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Privacy details
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} QuackNinja</p>
          <p>Runs locally in your browser. Your files stay on your device by default.</p>
        </div>
      </div>
    </footer>
  );
}
