export type Plan = "free" | "pro";

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "past_due"
  | "canceled";

export type BillingProfile = {
  id: string;
  email: string | null;
  plan: Plan;
  is_admin?: boolean;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  trial_consumed?: boolean | null;
};
