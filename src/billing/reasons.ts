import { PlanConfig } from "@/src/billing/plan";
import { formatLimit } from "@/src/lib/entitlements";
import { formatBytes } from "@/src/lib/planDisplay";

export type GateReason =
  | "file_too_large"
  | "session_limit"
  | "export_limit"
  | "saved_query_limit";

export const ReasonMessages: Record<
  GateReason,
  { title: string; description: string }
> = {
  file_too_large: {
    title: "File too large",
    description: "This file is over your plan limit.",
  },
  session_limit: {
    title: "Session limit reached",
    description: "This session is over your plan limit.",
  },
  export_limit: {
    title: "Export limit reached",
    description: "This export is over your plan limit.",
  },
  saved_query_limit: {
    title: "Saved query limit reached",
    description: "You've reached the saved queries limit for your plan.",
  },
};

export function getUpgradeFix(reason: GateReason) {
  const pro = PlanConfig.pro.limits;
  switch (reason) {
    case "file_too_large":
      return `Upgrade to Pro for files up to ${formatBytes(
        pro.maxSingleFileBytes
      )}.`;
    case "session_limit":
      return `Upgrade to Pro for total sessions up to ${formatBytes(
        pro.maxSessionFileBytes
      )}.`;
    case "export_limit":
      return `Upgrade to Pro to export up to ${formatLimit(
        pro.exportMaxRows
      )} rows.`;
    case "saved_query_limit":
      return `Upgrade to Pro for ${formatLimit(pro.maxSavedQueries)} saved queries.`;
    default:
      return "Upgrade to Pro for higher limits.";
  }
}
