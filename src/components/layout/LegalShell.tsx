import type { ReactNode } from "react";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { Footer } from "@/src/components/layout/Footer";

type LegalShellProps = {
  children: ReactNode;
};

export function LegalShell({ children }: LegalShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#F7FAFC_0%,#F2F5FA_100%)] text-[color:var(--text-primary)]">
      <AppHeader variant="docs" />
      <main className="relative flex-1">
        <div className="relative qn-container pb-16 pt-20">
          <div className="pointer-events-none absolute left-1/2 top-8 h-[360px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(9,206,164,0.16),rgba(9,206,164,0)_70%)] blur-3xl lg:left-[35%]" />
          <div className="relative">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
