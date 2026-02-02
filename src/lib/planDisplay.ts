import { formatLimit, getEntitlements, type PlanTier } from "@/src/lib/entitlements";

const BYTES_PER_GB = 1024 * 1024 * 1024;
const BYTES_PER_MB = 1024 * 1024;

type PlanDisplayLimits = {
  maxSingleFileBytes: number;
  maxSessionFileBytes: number;
  previewLimit: number;
  exportMaxRows: number;
  maxSavedQueries: number;
};

type PlanDisplayValues = {
  fileSize: string;
  sessionBudget: string;
  previewRows: string;
  exportRows: string;
  savedQueries: string;
};

export type PlanDisplay = {
  tier: PlanTier;
  label: string;
  limits: PlanDisplayLimits;
  display: PlanDisplayValues;
};

export function formatBytes(bytes: number) {
  if (bytes >= BYTES_PER_GB) {
    return `${(bytes / BYTES_PER_GB).toFixed(1)}GB`;
  }
  if (bytes >= BYTES_PER_MB) {
    return `${Math.round(bytes / BYTES_PER_MB)}MB`;
  }
  return `${Math.round(bytes / 1024)}KB`;
}

export function getPlanDisplay(plan: PlanTier): PlanDisplay {
  const limits = getEntitlements(plan);
  return {
    tier: plan,
    label: plan === "pro" ? "Pro" : "Free",
    limits: {
      maxSingleFileBytes: limits.maxSingleFileBytes,
      maxSessionFileBytes: limits.maxSessionFileBytes,
      previewLimit: limits.previewLimit,
      exportMaxRows: limits.exportMaxRows,
      maxSavedQueries: limits.maxSavedQueries,
    },
    display: {
      fileSize: formatBytes(limits.maxSingleFileBytes),
      sessionBudget: formatBytes(limits.maxSessionFileBytes),
      previewRows: limits.previewLimit.toLocaleString(),
      exportRows: formatLimit(limits.exportMaxRows),
      savedQueries: formatLimit(limits.maxSavedQueries),
    },
  };
}

const upgradeBulletKeys = [
  "file",
  "session",
  "preview",
  "export",
  "savedQueries",
] as const;

type UpgradeFocus = (typeof upgradeBulletKeys)[number];

export function getWhyUpgradeBullets(focus?: UpgradeFocus) {
  const pro = getPlanDisplay("pro");
  const bullets = [
    `Max single file size: ${pro.display.fileSize}`,
    `Total session size: ${pro.display.sessionBudget}`,
    `Preview up to ${pro.display.previewRows} rows`,
    `Export up to ${pro.display.exportRows} rows`,
    `${pro.display.savedQueries} saved queries`,
  ];

  if (!focus) {
    return bullets;
  }

  const focusIndex = upgradeBulletKeys.indexOf(focus);
  if (focusIndex < 0) {
    return bullets;
  }

  const [focused] = bullets.splice(focusIndex, 1);
  bullets.unshift(focused);
  return bullets;
}
