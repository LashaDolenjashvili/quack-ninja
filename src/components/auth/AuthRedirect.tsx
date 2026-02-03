"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { logClientError } from "@/src/lib/logger";

type AuthRedirectProps = {
  skip?: boolean;
};

export function AuthRedirect({ skip = false }: AuthRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    if (skip) {
      return () => {
        active = false;
      };
    }

    if (!supabaseConfigured) {
      return () => {
        active = false;
      };
    }

    const ensureSignedOut = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) {
        return;
      }
      if (data.session) {
        router.replace("/app/console");
      }
    };

    ensureSignedOut().catch((err) => {
      logClientError(err, "Auth redirect session check failed");
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          router.replace("/app/console");
        }
      }
    );

    return () => {
      active = false;
      listener.subscription?.unsubscribe();
    };
  }, [router, skip]);

  return null;
}
