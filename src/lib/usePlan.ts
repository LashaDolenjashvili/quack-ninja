"use client";

import { useMemo } from "react";
import { getEntitlements, type Entitlements, type PlanTier } from "@/src/lib/entitlements";
import { getActivePlan } from "@/src/billing/plan";
import { useProfile } from "@/src/billing/useProfile";
import { useEntitlements } from "@/src/lib/useEntitlements";

type Profile = {
  id: string;
  email: string | null;
  plan: PlanTier;
  is_admin: boolean;
};

export function usePlan() {
  const { profile: billingProfile, loading: profileLoading, refresh: refreshProfile } = useProfile();
  const {
    entitlements: entitlementsResponse,
    loading: entitlementsLoading,
    refresh: refreshEntitlements,
  } = useEntitlements();
  const plan = useMemo(
    () => entitlementsResponse?.plan ?? getActivePlan(billingProfile),
    [billingProfile, entitlementsResponse]
  );
  const profile = billingProfile
    ? ({
        id: billingProfile.id,
        email: billingProfile.email ?? null,
        plan,
        is_admin: Boolean(billingProfile.is_admin),
      } as Profile)
    : null;

  const entitlements: Entitlements = useMemo(() => {
    return entitlementsResponse?.limits ?? getEntitlements(plan);
  }, [entitlementsResponse, plan]);

  const trial = useMemo(
    () => ({
      active: Boolean(entitlementsResponse?.is_trial_active),
      endsAt: entitlementsResponse?.trial_ends_at ?? null,
      startedAt: entitlementsResponse?.trial_started_at ?? null,
      consumed: Boolean(entitlementsResponse?.trial_consumed),
      hasEnded: Boolean(entitlementsResponse?.trial_has_ended),
      enabled: Boolean(entitlementsResponse?.trial_enabled),
      serverNow: entitlementsResponse?.server_now ?? null,
    }),
    [entitlementsResponse]
  );

  return {
    plan,
    entitlements,
    trial,
    loading: profileLoading || entitlementsLoading,
    profile,
    isAdmin: Boolean(profile?.is_admin),
    refresh: () => {
      refreshProfile();
      refreshEntitlements();
    },
  };
}
