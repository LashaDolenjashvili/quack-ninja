"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { logClientError } from "@/src/lib/logger";
import type { Entitlements, PlanTier } from "@/src/lib/entitlements";

export type EntitlementsResponse = {
  plan: PlanTier;
  effective_plan?: PlanTier;
  limits: Entitlements;
  is_trial_active: boolean;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_consumed: boolean;
  trial_has_ended: boolean;
  trial_enabled: boolean;
  trial_days?: number;
  server_now: string;
};

const queryKey = ["billing", "entitlements"];

async function fetchEntitlements(): Promise<EntitlementsResponse | null> {
  if (!supabaseConfigured) {
    return null;
  }

  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const response = await fetch("/api/me/entitlements", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      throw new Error("Failed to load entitlements.");
    }

    return response.json();
  } catch (err) {
    logClientError(err, "Entitlements fetch failed");
    throw err;
  }
}

export function useEntitlements() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabaseConfigured) {
      return;
    }
    const { data } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey });
    });
    return () => {
      data.subscription?.unsubscribe();
    };
  }, [queryClient]);

  const query = useQuery({
    queryKey,
    queryFn: fetchEntitlements,
    staleTime: 30_000,
    enabled: true,
  });

  return {
    entitlements: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refresh: query.refetch,
  };
}
