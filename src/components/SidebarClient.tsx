"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/src/components/Sidebar";
import { usePlan } from "@/src/lib/usePlan";
import { getUpgradeHref } from "@/src/lib/upgrade";

export function SidebarClient() {
  const pathname = usePathname();
  const { plan, loading, profile, trial } = usePlan();
  if (pathname.startsWith("/docs")) {
    return null;
  }

  const upgradeHref = getUpgradeHref(Boolean(profile));
  const planLabel = loading
    ? "..."
    : trial.active
      ? "Pro (Trial)"
      : plan === "pro"
        ? "Pro"
        : "Free";

  return (
    <Sidebar
      userEmail={profile?.email ?? null}
      planLabel={planLabel}
      planTier={plan}
      upgradeHref={upgradeHref}
    />
  );
}
