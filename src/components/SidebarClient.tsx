"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/src/components/Sidebar";
import { usePlan } from "@/src/lib/usePlan";

export function SidebarClient() {
  const pathname = usePathname();
  const { plan, loading, profile } = usePlan();
  if (pathname.startsWith("/docs")) {
    return null;
  }

  const planLabel = loading ? "..." : plan === "pro" ? "Pro" : "Free";

  return (
    <Sidebar
      userEmail={profile?.email ?? null}
      planLabel={planLabel}
    />
  );
}
