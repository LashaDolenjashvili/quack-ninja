import { PLAN_LIMITS, type PlanTier } from "@/src/lib/planLimits";

export const XLSX_FAST_MODE_THRESHOLD_BYTES = 50 * 1024 * 1024;
const XLSX_BROWSER_LIMIT_BYTES = 100 * 1024 * 1024;
export const XLSX_MAX_BYTES_BY_PLAN: Record<PlanTier, number> = {
  free: PLAN_LIMITS.free.maxSingleFileBytes,
  pro: Math.min(PLAN_LIMITS.pro.maxSingleFileBytes, XLSX_BROWSER_LIMIT_BYTES),
};
export const XLSX_HARD_LIMIT_BYTES = XLSX_BROWSER_LIMIT_BYTES;
export const XLSX_COMPLEXITY_CELL_LIMIT = 10_000_000;

export const XLSX_DEFAULT_PREVIEW_ROWS = 12;
export const XLSX_DEFAULT_PREVIEW_COLS = 8;
export const XLSX_FAST_PREVIEW_ROWS = 200;
export const XLSX_FAST_PREVIEW_COLS = 80;

export const XLSX_SCAN_ROWS = 200;
export const XLSX_SCAN_COLS = 80;

export type XlsxPreflight =
  | { mode: "blocked"; reason: string; upgradeSuggested?: boolean }
  | { mode: "fast"; reason: string }
  | { mode: "normal" };

export function getXlsxPreflight(
  fileSize: number,
  plan: PlanTier
): XlsxPreflight {
  if (fileSize > XLSX_HARD_LIMIT_BYTES) {
    return {
      mode: "blocked",
      reason:
        "Excel files over 100MB are not supported reliably in browser. Please convert to CSV.",
    };
  }
  if (plan === "free" && fileSize > XLSX_MAX_BYTES_BY_PLAN.free) {
    return {
      mode: "blocked",
      reason:
        `Free supports Excel imports up to ${Math.round(
          XLSX_MAX_BYTES_BY_PLAN.free / (1024 * 1024)
        )}MB.`,
      upgradeSuggested: true,
    };
  }
  if (plan === "pro" && fileSize > XLSX_FAST_MODE_THRESHOLD_BYTES) {
    return {
      mode: "fast",
      reason: "Large Excel detected — Fast Import Mode enabled for stability.",
    };
  }
  return { mode: "normal" };
}
