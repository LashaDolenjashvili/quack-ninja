"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { parsePlanTier } from "@/src/lib/entitlements";
import type { BillingProfile } from "@/src/billing/types";

const queryKey = ["billing", "profile"];

async function fetchProfile(): Promise<BillingProfile | null> {
  if (!supabaseConfigured) {
    return null;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  const { data } = await supabase
    .from("profiles")
    .select("id, email, plan, is_admin")
    .eq("id", user.id)
    .maybeSingle<BillingProfile>();
  const plan = parsePlanTier(data?.plan);
  return {
    id: user.id,
    email: data?.email ?? user.email ?? null,
    plan,
    is_admin: Boolean(data?.is_admin),
  };
}

export function useProfile() {
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
    queryFn: fetchProfile,
    staleTime: 60_000,
    enabled: supabaseConfigured,
  });

  return {
    profile: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refresh: query.refetch,
  };
}
