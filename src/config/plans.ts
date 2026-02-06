const MB = 1024 * 1024;
const GB = 1024 * 1024 * 1024;

export const BILLING_ENABLED = false;
export const BILLING_EARLY_ACCESS = !BILLING_ENABLED;
export const BILLING_COMING_SOON = !BILLING_ENABLED;
export const TRIAL_ENABLED_CLIENT = false;
export const TRIAL_ENABLED_SERVER = false;
export const TRIAL_ENABLED = false;

export const TRIAL_DAYS = 7;

export const FREE_LIMITS = {
  max_single_file_size_mb: 25,
  total_session_size_mb: 100,
  preview_rows: 1000,
  export_rows: 1000,
  saved_queries: 3,
} as const;

export const PRO_LIMITS = {
  max_single_file_size_mb: 1024,
  total_session_size_mb: 2048,
  preview_rows: 10000,
  export_rows: 500000,
  saved_queries: Number.POSITIVE_INFINITY,
} as const;

export const FREE_LIMITS_BYTES = {
  maxSingleFileBytes: FREE_LIMITS.max_single_file_size_mb * MB,
  maxSessionBytes: FREE_LIMITS.total_session_size_mb * MB,
  previewRowLimit: FREE_LIMITS.preview_rows,
  exportRowLimit: FREE_LIMITS.export_rows,
  savedQueriesLimit: FREE_LIMITS.saved_queries,
};

export const PRO_LIMITS_BYTES = {
  maxSingleFileBytes: PRO_LIMITS.max_single_file_size_mb * MB,
  maxSessionBytes: PRO_LIMITS.total_session_size_mb * MB,
  previewRowLimit: PRO_LIMITS.preview_rows,
  exportRowLimit: PRO_LIMITS.export_rows,
  savedQueriesLimit: PRO_LIMITS.saved_queries,
};

export function getLimitsForEffectivePlan(plan: "free" | "pro") {
  return plan === "pro" ? PRO_LIMITS_BYTES : FREE_LIMITS_BYTES;
}

export { MB, GB };
