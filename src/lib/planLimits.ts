import type { Plan } from "@/src/billing/types";
export type PlanTier = Plan;
import { FREE_LIMITS_BYTES, PRO_LIMITS_BYTES, GB, MB } from "@/src/config/plans";

export type PlanLimitValues = {
  maxSingleFileBytes: number;
  maxSessionBytes: number;
  previewRowLimit: number;
  exportRowLimit: number;
  savedQueriesLimit: number;
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimitValues> = {
  free: FREE_LIMITS_BYTES,
  pro: PRO_LIMITS_BYTES,
};

const BYTES_PER_GB = GB;
const BYTES_PER_MB = MB;

export function formatBytes(bytes: number) {
  if (bytes >= BYTES_PER_GB) {
    return `${(bytes / BYTES_PER_GB).toFixed(1)}GB`;
  }
  if (bytes >= BYTES_PER_MB) {
    return `${Math.round(bytes / BYTES_PER_MB)}MB`;
  }
  return `${Math.round(bytes / 1024)}KB`;
}

export function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toLocaleString() : "Unlimited";
}
