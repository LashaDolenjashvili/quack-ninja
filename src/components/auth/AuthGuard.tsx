"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseConfigured } from "@/src/lib/supabaseClient";
import { useAuth } from "@/src/components/auth/AuthProvider";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!supabaseConfigured) {
      return;
    }
    if (!loading && !user) {
      router.replace("/auth/sign-in");
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7FAFC] text-sm text-[#5B6B82]">
        Loading...
      </div>
    );
  }

  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7FAFC] text-sm text-[#5B6B82]">
        Supabase is not configured. Add env vars to continue.
      </div>
    );
  }

  return <>{children}</>;
}
