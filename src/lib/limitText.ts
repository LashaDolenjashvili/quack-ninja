import { PlanConfig, type PlanTier } from "@/src/lib/plans";
import { formatLimit } from "@/src/lib/entitlements";
import { formatBytes } from "@/src/lib/planDisplay";

export type LimitText = {
  maxSingleFileSize: string;
  maxSessionSize: string;
  previewRows: string;
  exportRows: string;
  savedQueries: string;
  splitExportsEnabled: boolean;
};

export function getLimitText(plan: PlanTier): LimitText {
  const { limits, features } = PlanConfig[plan];
  return {
    maxSingleFileSize: formatBytes(limits.maxSingleFileBytes),
    maxSessionSize: formatBytes(limits.maxSessionFileBytes),
    previewRows: limits.previewLimit.toLocaleString(),
    exportRows: formatLimit(limits.exportMaxRows),
    savedQueries: formatLimit(limits.maxSavedQueries),
    splitExportsEnabled: features.splitExport,
  };
}

export function getLimitSuggestions(options?: { includeParquet?: boolean }) {
  const suggestions = [
    "Split large files before attaching.",
    "Add a LIMIT to reduce preview rows.",
    "Export in smaller chunks when capped.",
  ];
  if (options?.includeParquet) {
    suggestions.push("Use Parquet for large datasets when available.");
  }
  return suggestions;
}
