import Link from "next/link";
import { Logo } from "@/src/components/Logo";

export function MarketingFooter() {
  return (
    <footer className="bg-[#002D5A] py-10 text-white">
      <div className="h-px w-full bg-gradient-to-r from-white/0 via-white/15 to-white/0" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Logo showText />
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-white/80">
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
          <a
            href="mailto:support@quackninja.com"
            className="rounded-sm text-white/85 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Contact
          </a>
        </div>
        <p className="text-xs text-white/70">
          © {new Date().getFullYear()} QuackNinja
        </p>
      </div>
    </footer>
  );
}
