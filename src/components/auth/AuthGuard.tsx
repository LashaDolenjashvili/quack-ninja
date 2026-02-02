"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { logClientError } from "@/src/lib/logger";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    if (!supabaseConfigured) {
      setReady(true);
      return () => {
        active = false;
      };
    }

    const ensureSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) {
        return;
      }
      if (!data.session) {
        router.replace("/auth/sign-in");
        return;
      }
      setReady(true);
    };

    ensureSession().catch((err) => {
      logClientError(err, "Auth guard session check failed");
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/auth/sign-in");
          return;
        }
        setReady(true);
      }
    );

    return () => {
      active = false;
      listener.subscription?.unsubscribe();
    };
  }, [router]);

  if (!ready) {
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
