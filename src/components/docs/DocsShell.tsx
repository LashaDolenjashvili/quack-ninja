"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/src/components/Sidebar";
import { usePlan } from "@/src/lib/usePlan";

export function DocsShell({ children }: { children: ReactNode }) {
  const { plan, loading, profile } = usePlan();
  const planLabel = loading ? "..." : plan === "pro" ? "Pro" : "Free";

  return (
    <div className="flex min-h-screen bg-[#F7FAFC] text-[color:var(--text-primary)]">
      <Sidebar
        userEmail={profile?.email ?? null}
        planLabel={planLabel}
      />
      <main className="flex-1">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-40 top-[-120px] h-72 w-72 rounded-full bg-[#09CEA4]/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-[120px] h-80 w-80 rounded-full bg-[#5BA9FF]/10 blur-3xl" />
          <div className="mx-auto w-full max-w-[1400px] px-6 py-10 lg:px-10 lg:py-14">
            <section>{children}</section>
          </div>
        </div>
      </main>
    </div>
  );
}
