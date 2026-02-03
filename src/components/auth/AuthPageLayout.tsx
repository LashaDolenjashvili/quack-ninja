"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AuthTopBar } from "@/src/components/auth/AuthTopBar";

type AuthPageLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  badge?: string | null;
  helper?: ReactNode;
  showInfoPanel?: boolean;
};

export function AuthPageLayout({
  children,
  title,
  subtitle,
  badge = null,
  helper,
  showInfoPanel = true,
}: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FAFC_0%,#F2F5FA_100%)] text-[#0B1220]">
      <AuthTopBar />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-12">
        <div className="pointer-events-none absolute left-1/2 top-12 h-[420px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(9,206,164,0.18),rgba(9,206,164,0)_70%)] blur-3xl lg:left-[28%]" />

        <div className="mt-6 flex min-h-[calc(100vh-160px)] items-start lg:items-center">
          <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
            <div className="w-full max-w-md justify-self-center lg:justify-self-start">
              <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-lg md:p-8">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                {title}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-[#0B1220]">
                  {subtitle}
                </h1>
                {badge ? (
                  <span className="rounded-full border border-[#BFECE1] bg-[#EAFBF6] px-3 py-1 text-xs font-semibold text-[#0B6D58]">
                    {badge}
                  </span>
                ) : null}
              </div>
              {helper ? <div className="text-sm text-[#5B6B82]">{helper}</div> : null}
            </div>
            <div className="mt-6">{children}</div>
              </div>
            </div>

          {showInfoPanel ? (
            <aside className="w-full max-w-lg rounded-2xl border border-slate-200/60 bg-[#F7FAFC] p-6 text-sm text-[#4A5A72] shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                Why QuackNinja?
              </p>
              <ul className="mt-3 space-y-3 text-sm">
                {[
                  "Works with CSV, Excel, and Parquet.",
                  "Your files stay on your computer.",
                  "Export only the results you need.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-[#09CEA4]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-[#5B6B82]">
                We never upload your files.
              </p>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                  Use it for
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>Check an export for missing values or duplicates.</li>
                  <li>Combine two exports to answer a question.</li>
                  <li>Pull a clean subset to share with a teammate.</li>
                </ul>
              </div>
            </aside>
          ) : null}
          </div>
        </div>
      </div>

      <footer className="mt-10 bg-[#002D5A] py-6 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/80">
            © {new Date().getFullYear()} QuackNinja
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-white/80">
            <Link
              href="/terms-and-conditions"
              className="rounded-sm underline-offset-4 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Terms
            </Link>
            <Link
              href="/privacy-policy"
              className="rounded-sm underline-offset-4 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Privacy
            </Link>
            <Link
              href="/refund-policy"
              className="rounded-sm underline-offset-4 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Refunds
            </Link>
            <a
              href="mailto:support@quackninja.com"
              className="rounded-sm underline-offset-4 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
