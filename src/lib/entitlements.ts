import { PlanConfig, can } from "@/src/billing/plan";
import type { Plan } from "@/src/billing/types";

export type PlanTier = Plan;

export type Entitlements = {
  plan: PlanTier;
  maxSavedQueries: number;
  maxFileBytes: number;
  maxTotalFileBytes: number;
  maxSingleFileBytes: number;
  maxSessionFileBytes: number;
  previewLimit: number;
  maxRenderRows: number;
  exportMaxRows: number;
  splitExportEnabled: boolean;
};

const PLAN_ENTITLEMENTS: Record<PlanTier, Omit<Entitlements, "plan">> = {
  free: {
    ...PlanConfig.free.limits,
    splitExportEnabled: PlanConfig.free.features.splitExport,
  },
  pro: {
    ...PlanConfig.pro.limits,
    splitExportEnabled: PlanConfig.pro.features.splitExport,
  },
};

export function parsePlanTier(value?: string | null): PlanTier {
  return value === "pro" ? "pro" : "free";
}

export function getEntitlements(plan: PlanTier): Entitlements {
  return { plan, ...PLAN_ENTITLEMENTS[plan] };
}

export function canAttachFile(fileSize: number, limits: Entitlements) {
  return (
    can("attach_file", { plan: limits.plan, fileSize }) === true
  );
}

export function canAttachTotal(totalSize: number, limits: Entitlements) {
  return (
    can("attach_total", { plan: limits.plan, totalSize }) === true
  );
}

export function canSaveQuery(activeCount: number, limits: Entitlements) {
  return (
    can("save_query", { plan: limits.plan, activeCount }) === true
  );
}

export function getPreviewLimit(plan: PlanTier) {
  return PLAN_ENTITLEMENTS[plan].previewLimit;
}

export function getExportCap(plan: PlanTier) {
  return PLAN_ENTITLEMENTS[plan].exportMaxRows;
}

export function formatLimit(value: number) {
  return Number.isFinite(value) ? value.toLocaleString() : "Unlimited";
}

export const planEntitlements = PLAN_ENTITLEMENTS;
