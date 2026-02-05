import Link from "next/link";
import { Logo } from "@/src/components/Logo";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#002D5A] text-white">
      <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(9,206,164,0.18),rgba(9,206,164,0)_70%)] blur-2xl" />
      <div className="h-px w-full bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
      <div className="qn-container relative grid gap-8 py-12 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Logo showMark={false} showText />
          <p className="text-sm text-white/75">
            Local-first SQL for exports.
          </p>
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} QuackNinja
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            Product
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-white/80">
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
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            Legal
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-white/80">
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
            <a
              href="mailto:support@quackninja.com"
              className="rounded-sm underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
