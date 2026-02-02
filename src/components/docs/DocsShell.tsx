"use client";

import type { ReactNode } from "react";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { DocsSidebar } from "@/src/components/docs/DocsSidebar";
import { docsNav } from "@/src/docs/docsContent";

export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#0B1220]">
      <AppHeader variant="docs" />
      <div className="mx-auto flex w-full max-w-6xl gap-0 px-0">
        <DocsSidebar nav={docsNav} />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
