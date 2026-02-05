"use client";

import type { ReactNode } from "react";
import { AuthTopBar } from "@/src/components/auth/AuthTopBar";
import { Footer } from "@/src/components/layout/Footer";

type AuthShellProps = {
  left: ReactNode;
  right?: ReactNode;
};

export function AuthShell({ left, right }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#F7FAFC_0%,#F2F5FA_100%)] text-[color:var(--text-primary)]">
      <AuthTopBar />
      <main className="relative flex-1">
        <div className="relative qn-container pb-12">
          <div className="pointer-events-none absolute left-1/2 top-10 h-[420px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(9,206,164,0.18),rgba(9,206,164,0)_70%)] blur-3xl lg:left-[28%]" />
          <div className="mt-6 flex min-h-[calc(100vh-160px)] items-start lg:items-center">
            <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
              <div className="w-full max-w-md justify-self-center lg:justify-self-start">
                {left}
              </div>
              {right ? (
                <div className="w-full max-w-lg justify-self-center lg:justify-self-start">
                  {right}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
