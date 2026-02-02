import {
  canAttachFile,
  canAttachTotal,
  canSaveQuery,
  formatLimit,
  getEntitlements,
  getExportCap,
  getPreviewLimit,
  parsePlanTier,
  type Entitlements,
  type PlanTier,
} from "@/src/lib/entitlements";
import { PlanConfig as BillingPlanConfig } from "@/src/billing/plan";

export type PlanLimits = Entitlements;
export type { PlanTier };

export const PlanConfig = BillingPlanConfig;

export function getPlanTier(value?: string | null): PlanTier {
  return parsePlanTier(value);
}

export function getLimits(tier: PlanTier) {
  return getEntitlements(tier);
}

export {
  canAttachFile,
  canAttachTotal,
  canSaveQuery,
  getPreviewLimit,
  getExportCap,
  formatLimit,
};
