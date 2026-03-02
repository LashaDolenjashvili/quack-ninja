export type Plan = "free" | "pro";

export type PlanCode =
  | "free"
  | "individual"
  | "team_5"
  | "team_10"
  | "team_unlimited";

export type BillingRole = "none" | "owner" | "member";

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "past_due"
  | "canceled";

export type BillingProfile = {
  id: string;
  email: string | null;
  plan: Plan;
  billing_role?: BillingRole;
  is_admin?: boolean;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  trial_consumed?: boolean | null;
};

export type SubscriptionRecord = {
  id?: string;
  owner_user_id: string;
  provider: "paddle" | "manual";
  provider_customer_id?: string | null;
  provider_subscription_id?: string | null;
  paddle_product_id?: string | null;
  paddle_price_id?: string | null;
  paddle_checkout_id?: string | null;
  plan_code: Exclude<PlanCode, "free">;
  seat_limit: number | null;
  billing_interval: "month";
  currency_code?: string | null;
  amount_cents?: number | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};
