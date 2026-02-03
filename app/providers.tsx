"use client";

import { AuthProvider } from "@/src/components/auth/AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
