"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { logClientError } from "@/src/lib/logger";
import { getEntitlements, type Entitlements, type PlanTier } from "@/src/lib/entitlements";
import type { BillingRole } from "@/src/billing/types";

export type EntitlementsResponse = {
  plan: PlanTier;
  effective_plan?: PlanTier;
  billing_role?: BillingRole;
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

function getFallbackEntitlements(): EntitlementsResponse {
  return {
    plan: "free",
    effective_plan: "free",
    billing_role: "none",
    limits: getEntitlements("free"),
    is_trial_active: false,
    trial_started_at: null,
    trial_ends_at: null,
    trial_consumed: false,
    trial_has_ended: false,
    trial_enabled: true,
    trial_days: 7,
    server_now: new Date().toISOString(),
  };
}

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
      logClientError(
        new Error(`Failed to load entitlements (${response.status}).`),
        "Entitlements fetch failed"
      );
      return getFallbackEntitlements();
    }

    return response.json();
  } catch (err) {
    logClientError(err, "Entitlements fetch failed");
    return getFallbackEntitlements();
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
