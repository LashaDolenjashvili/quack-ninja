import type { PlanCode } from "@/src/billing/types";

export type PaidPlanCode = Exclude<PlanCode, "free">;

export type CatalogPlan = {
  code: PlanCode;
  label: string;
  monthlyPriceLabel: string;
  seatLimit: number | null;
  entitlementTier: "free" | "pro";
};

export const BILLING_CATALOG: Record<PlanCode, CatalogPlan> = {
  free: {
    code: "free",
    label: "Free",
    monthlyPriceLabel: "$0",
    seatLimit: 1,
    entitlementTier: "free",
  },
  individual: {
    code: "individual",
    label: "Individual",
    monthlyPriceLabel: "$12/mo",
    seatLimit: 1,
    entitlementTier: "pro",
  },
  team_5: {
    code: "team_5",
    label: "Team 5",
    monthlyPriceLabel: "$39/mo",
    seatLimit: 5,
    entitlementTier: "pro",
  },
  team_10: {
    code: "team_10",
    label: "Team 10",
    monthlyPriceLabel: "$69/mo",
    seatLimit: 10,
    entitlementTier: "pro",
  },
  team_unlimited: {
    code: "team_unlimited",
    label: "Team Unlimited",
    monthlyPriceLabel: "$149/mo",
    seatLimit: null,
    entitlementTier: "pro",
  },
};

export function isPaidPlanCode(value: unknown): value is PaidPlanCode {
  return (
    value === "individual" ||
    value === "team_5" ||
    value === "team_10" ||
    value === "team_unlimited"
  );
}

export function parsePlanCode(value: unknown): PlanCode {
  return typeof value === "string" && value in BILLING_CATALOG
    ? (value as PlanCode)
    : "free";
}

export function getSeatLimitForPlanCode(planCode: PaidPlanCode): number | null {
  return BILLING_CATALOG[planCode].seatLimit;
}

export function getPaddlePriceIdForPlanCode(planCode: PaidPlanCode) {
  const mapping: Record<PaidPlanCode, string> = {
    individual:
      process.env.PADDLE_PRICE_ID_INDIVIDUAL_MONTHLY ??
      process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_INDIVIDUAL_MONTHLY ??
      "",
    team_5:
      process.env.PADDLE_PRICE_ID_TEAM_5_MONTHLY ??
      process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_5_MONTHLY ??
      "",
    team_10:
      process.env.PADDLE_PRICE_ID_TEAM_10_MONTHLY ??
      process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_10_MONTHLY ??
      "",
    team_unlimited:
      process.env.PADDLE_PRICE_ID_TEAM_UNLIMITED_MONTHLY ??
      process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_UNLIMITED_MONTHLY ??
      "",
  };
  return mapping[planCode];
}

export function getAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}

export function getSuccessUrl() {
  return `${getAppUrl()}/app/settings?billing=success`;
}

export function getCancelUrl() {
  return `${getAppUrl()}/pricing?billing=canceled`;
}
