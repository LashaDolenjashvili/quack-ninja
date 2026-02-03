"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseConfigured } from "@/src/lib/supabaseClient";
import { useAuth } from "@/src/components/auth/AuthProvider";

type AuthRedirectProps = {
  skip?: boolean;
};

export function AuthRedirect({ skip = false }: AuthRedirectProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (skip) {
      return;
    }

    if (!supabaseConfigured) {
      return;
    }
    if (!loading && user) {
      router.replace("/app/console");
    }
  }, [loading, router, skip, user]);

  return null;
}
