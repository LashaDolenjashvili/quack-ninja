"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationLogger() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }
    const query = searchParams?.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    console.log(`[nav] ${target}`);
  }, [pathname, searchParams]);

  return null;
}
