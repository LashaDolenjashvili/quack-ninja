import type { BillingProfile, Plan } from "@/src/billing/types";
import type { GateReason } from "@/src/billing/reasons";
import { PLAN_LIMITS } from "@/src/lib/planLimits";

export type PlanLimits = {
  maxSavedQueries: number;
  maxFileBytes: number;
  maxTotalFileBytes: number;
  maxSingleFileBytes: number;
  maxSessionFileBytes: number;
  previewLimit: number;
  maxRenderRows: number;
  exportMaxRows: number;
};

export type PlanFeatures = {
  splitExport: boolean;
};

export const PlanConfig: Record<
  Plan,
  { limits: PlanLimits; features: PlanFeatures }
> = {
  free: {
    limits: {
      maxSavedQueries: PLAN_LIMITS.free.savedQueriesLimit,
      maxFileBytes: PLAN_LIMITS.free.maxSingleFileBytes,
      maxTotalFileBytes: PLAN_LIMITS.free.maxSessionBytes,
      maxSingleFileBytes: PLAN_LIMITS.free.maxSingleFileBytes,
      maxSessionFileBytes: PLAN_LIMITS.free.maxSessionBytes,
      previewLimit: PLAN_LIMITS.free.previewRowLimit,
      maxRenderRows: PLAN_LIMITS.free.previewRowLimit,
      exportMaxRows: PLAN_LIMITS.free.exportRowLimit,
    },
    features: {
      splitExport: false,
    },
  },
  pro: {
    limits: {
      maxSavedQueries: PLAN_LIMITS.pro.savedQueriesLimit,
      maxFileBytes: PLAN_LIMITS.pro.maxSingleFileBytes,
      maxTotalFileBytes: PLAN_LIMITS.pro.maxSessionBytes,
      maxSingleFileBytes: PLAN_LIMITS.pro.maxSingleFileBytes,
      maxSessionFileBytes: PLAN_LIMITS.pro.maxSessionBytes,
      previewLimit: PLAN_LIMITS.pro.previewRowLimit,
      maxRenderRows: PLAN_LIMITS.pro.previewRowLimit,
      exportMaxRows: PLAN_LIMITS.pro.exportRowLimit,
    },
    features: {
      splitExport: true,
    },
  },
};

export function getActivePlan(profile?: BillingProfile | null): Plan {
  return profile?.plan === "pro" ? "pro" : "free";
}

export function getLimit(plan: Plan, key: keyof PlanLimits) {
  return PlanConfig[plan].limits[key];
}

type GateContextMap = {
  attach_file: { plan: Plan; fileSize: number };
  attach_total: { plan: Plan; totalSize: number };
  save_query: { plan: Plan; activeCount: number };
  export_rows: { plan: Plan; rows: number };
  split_export: { plan: Plan };
};

export type GateResult =
  | true
  | {
      ok: false;
      reason: GateReason;
    };

export function can<T extends keyof GateContextMap>(
  feature: T,
  context: GateContextMap[T]
): GateResult {
  const limits = PlanConfig[context.plan].limits;
  switch (feature) {
    case "attach_file":
      return (context as GateContextMap["attach_file"]).fileSize <=
        limits.maxSingleFileBytes
        ? true
        : { ok: false, reason: "file_too_large" };
    case "attach_total":
      return (context as GateContextMap["attach_total"]).totalSize <=
        limits.maxSessionFileBytes
        ? true
        : { ok: false, reason: "session_limit" };
    case "save_query":
      return (context as GateContextMap["save_query"]).activeCount <
        limits.maxSavedQueries
        ? true
        : { ok: false, reason: "saved_query_limit" };
    case "export_rows":
      return (context as GateContextMap["export_rows"]).rows <=
        limits.exportMaxRows
        ? true
        : { ok: false, reason: "export_limit" };
    case "split_export":
      return PlanConfig[context.plan].features.splitExport
        ? true
        : { ok: false, reason: "export_limit" };
    default:
      return true;
  }
}
