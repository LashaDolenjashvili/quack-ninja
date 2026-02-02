import {
  planEntitlements,
  type Entitlements,
  type PlanTier,
} from "@/src/lib/entitlements";

export type { PlanTier };
export type PlanLimits = Entitlements;

export const planCaps: Record<PlanTier, PlanLimits> = {
  free: { plan: "free", ...planEntitlements.free },
  pro: { plan: "pro", ...planEntitlements.pro },
};
