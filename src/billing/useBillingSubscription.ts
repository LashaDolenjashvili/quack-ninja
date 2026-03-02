"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { BillingRole, SubscriptionRecord } from "@/src/billing/types";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";

export type BillingSubscriptionResponse = {
  subscription: SubscriptionRecord | null;
  billing_role: BillingRole;
  members: { id: string; email: string | null; created_at: string }[];
  seats_used: number;
  seats_remaining: number | null;
};

const queryKey = ["billing", "subscription"];

async function fetchBillingSubscription(): Promise<BillingSubscriptionResponse | null> {
  if (!supabaseConfigured) {
    return null;
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    return null;
  }
  const response = await fetch("/api/billing/subscription", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to load billing subscription.");
  }
  return response.json();
}

export function useBillingSubscription() {
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
    queryFn: fetchBillingSubscription,
    staleTime: 15_000,
    enabled: true,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refresh: query.refetch,
  };
}
