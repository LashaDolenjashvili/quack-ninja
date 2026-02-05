"use client";

import type { ReactNode } from "react";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { Footer } from "@/src/components/layout/Footer";
import { DocsSidebar } from "@/src/components/docs/DocsSidebar";
import { docsNav } from "@/src/docs/docsContent";

export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--color-bg)] text-[color:var(--text-primary)]">
      <AppHeader variant="docs" />
      <main className="flex-1">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-40 top-[-120px] h-72 w-72 rounded-full bg-[#09CEA4]/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-[120px] h-80 w-80 rounded-full bg-[#5BA9FF]/10 blur-3xl" />
          <div className="qn-container flex gap-8 px-0 py-10 lg:py-14">
            <DocsSidebar nav={docsNav} />
            <section className="flex-1">{children}</section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
