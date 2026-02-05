"use client";

import type { ReactNode } from "react";
import { AuthShell } from "@/src/components/auth/AuthShell";
import { AuthCard } from "@/src/components/auth/AuthCard";
import { AuthHeader } from "@/src/components/auth/AuthHeader";
import { AuthValueCard } from "@/src/components/auth/AuthValueCard";

type AuthPageLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  subhead?: string;
  badge?: string | null;
  helper?: ReactNode;
  showInfoPanel?: boolean;
};

export function AuthPageLayout({
  children,
  title,
  subtitle,
  subhead,
  badge = null,
  helper,
  showInfoPanel = true,
}: AuthPageLayoutProps) {
  return (
    <AuthShell
      left={
        <AuthCard>
          <AuthHeader
            kicker={title}
            title={subtitle}
            subtitle={subhead}
            badge={
              badge ? (
                <span className="rounded-full border border-[#BFECE1] bg-[#EAFBF6] px-3 py-1 text-xs font-semibold text-[#0B6D58]">
                  {badge}
                </span>
              ) : null
            }
          />
          {typeof helper !== "string" && helper ? (
            <div className="mt-2 text-sm text-[color:var(--text-secondary)]">
              {helper}
            </div>
          ) : null}
          <div className="mt-6">{children}</div>
        </AuthCard>
      }
      right={showInfoPanel ? <AuthValueCard /> : undefined}
    />
  );
}
