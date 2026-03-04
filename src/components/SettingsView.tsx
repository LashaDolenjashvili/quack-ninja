"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { buttonClassName } from "@/src/components/ui/button";
import { usePlan } from "@/src/lib/usePlan";
import { useConsoleSession } from "@/src/components/ConsoleSessionProvider";
import { getPlanDisplay } from "@/src/lib/planDisplay";
import { useBillingSubscription } from "@/src/billing/useBillingSubscription";
import { StartCheckoutButton } from "@/src/components/billing/StartCheckoutButton";
import { BILLING_CATALOG, type PaidPlanCode } from "@/src/billing/catalog";
import { formatTrialEndDate } from "@/src/lib/trial";
import type { AccessSource, SubscriptionRecord } from "@/src/billing/types";

function getPlanActionLabel({
  targetPlanCode,
  activeSubscription,
}: {
  targetPlanCode: PaidPlanCode;
  activeSubscription: SubscriptionRecord | null;
}) {
  if (!activeSubscription || activeSubscription.provider !== "paddle") {
    return `Start ${BILLING_CATALOG[targetPlanCode].label}`;
  }

  const currentPlanCode = activeSubscription.plan_code;
  if (currentPlanCode === targetPlanCode) {
    return "Current plan";
  }

  return `Switch to ${BILLING_CATALOG[targetPlanCode].label}`;
}

export function SettingsView() {
  const { plan, loading, profile, isAdmin, refresh, trial } = usePlan();
  const { savedQueries } = useConsoleSession();
  const searchParams = useSearchParams();
  const { data: billingData, loading: billingLoading, refresh: refreshBilling } =
    useBillingSubscription();
  const savedCount = savedQueries.length;
  const [adminTargetId, setAdminTargetId] = useState("");
  const [adminStatus, setAdminStatus] = useState<string | null>(null);
  const [adminWorking, setAdminWorking] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberStatus, setMemberStatus] = useState<string | null>(null);
  const [memberWorking, setMemberWorking] = useState(false);
  const [subscriptionWorking, setSubscriptionWorking] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const accessSource: AccessSource | null = billingData?.access_source ?? null;
  const subscription = billingData?.subscription ?? null;
  const latestSubscription = billingData?.latest_subscription ?? null;
  const hasActivePaidAccess = accessSource === "subscription" || accessSource === "complimentary";
  const planLabel = loading
    ? "Loading..."
    : accessSource === "subscription" && subscription
        ? BILLING_CATALOG[subscription.plan_code].label
        : accessSource === "complimentary"
          ? "Individual (Complimentary)"
          : accessSource === "trial" || (trial.active && !hasActivePaidAccess)
            ? "Pro Trial"
            : "Free";
  const isPaidPro = plan === "pro";
  const freePlan = getPlanDisplay("free");
  const proPlan = getPlanDisplay("pro");
  const activePlan = plan === "pro" ? proPlan : freePlan;
  const billingSuccess = searchParams?.get("billing") === "success";
  const billingRole = billingData?.billing_role ?? "none";
  const canManageSubscription =
    billingRole === "owner" &&
    subscription !== null &&
    subscription.provider === "paddle";
  const isTeamOwner =
    billingRole === "owner" &&
    subscription !== null &&
    subscription.plan_code !== "individual";
  const currentPaidLabel = subscription ? BILLING_CATALOG[subscription.plan_code].label : null;
  const statusSubscription = subscription ?? latestSubscription;
  const isComplimentaryIndividual = accessSource === "complimentary";
  const subscriptionBadgeLabel =
    hasActivePaidAccess && subscription
      ? isComplimentaryIndividual
        ? "Complimentary access"
        : subscription.cancel_at_period_end || !subscription.auto_renew
          ? `${currentPaidLabel} ending`
          : `${currentPaidLabel} active`
      : accessSource === "trial" || (trial.active && !hasActivePaidAccess)
        ? "Trial access"
        : "Free plan";
  const showPlanOptions = !subscription || Boolean(billingData?.show_plan_options);
  const trialPanelVisible =
    (trial.active || billingData?.trial_active) && !hasActivePaidAccess;
  const trialEndsAt = billingData?.trial_ends_at ?? trial.endsAt;
  const trialCountdown = billingData?.trial_countdown ?? null;
  const renewalLabel = isComplimentaryIndividual
    ? "Managed manually"
    : subscription
      ? subscription.change_type === "downgrade" && subscription.change_effective_at
        ? `Changes ${new Date(subscription.change_effective_at).toLocaleDateString()}`
        : subscription.cancel_at_period_end || !subscription.auto_renew
        ? subscription.current_period_end
          ? `Ends ${new Date(subscription.current_period_end).toLocaleDateString()}`
          : "Ends at period close"
        : subscription.current_period_end
          ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
          : "Auto-renews monthly"
      : "—";
  const renewalHeading = isComplimentaryIndividual
    ? "Renewal"
    : subscription && (subscription.cancel_at_period_end || !subscription.auto_renew)
      ? "End date"
      : "Renewal date";
  const accessStatusLabel = loading
    ? "Loading..."
    : accessSource === "trial" || (trial.active && !hasActivePaidAccess)
      ? "Trial"
      : hasActivePaidAccess
        ? "Active"
        : "Free";
  const accessStatusTone =
    hasActivePaidAccess || trialPanelVisible ? "bg-[#09CEA4]" : "bg-[#7A8AA1]";
  const statusMessage = (() => {
    if (billingSuccess) {
      return "Checkout completed. Your subscription is syncing now. Refresh in a few seconds if needed.";
    }
    if (isComplimentaryIndividual) {
      return "You are on a complimentary Individual plan while we collect product feedback.";
    }
    if (statusSubscription && !subscription) {
      const historicalLabel = BILLING_CATALOG[statusSubscription.plan_code].label;
      return trialPanelVisible
        ? `Your last paid subscription (${historicalLabel}) is ${statusSubscription.status}. Trial access is active until your trial ends.`
        : `Your last paid subscription (${historicalLabel}) is ${statusSubscription.status}. You are currently on the Free plan.`;
    }
    if (trialPanelVisible) {
      return "Your free trial is active. Starting a paid plan does not remove the trial banner, but paid billing begins immediately after checkout.";
    }
    if (subscription) {
      if (subscription.change_type === "downgrade" && subscription.pending_plan_code) {
        return `A downgrade to ${BILLING_CATALOG[subscription.pending_plan_code].label} is scheduled for the end of the current term.`;
      }
      if (subscription.cancel_at_period_end || !subscription.auto_renew) {
        return "This plan is set to end at the close of the current term unless you renew.";
      }
      return `Subscription status: ${subscription.status}.`;
    }
    return "Choose a plan when you need higher limits or paid team access.";
  })();
  const targetId = useMemo(
    () => adminTargetId.trim() || profile?.id || "",
    [adminTargetId, profile?.id]
  );

  const handleAdminSetPlan = async (nextPlan: "free" | "pro") => {
    if (!supabaseConfigured) {
      setAdminStatus("Supabase is not configured.");
      return;
    }
    if (!targetId) {
      setAdminStatus("Enter a user id to update.");
      return;
    }
    setAdminWorking(true);
    setAdminStatus(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setAdminStatus("No active session. Sign in again.");
        return;
      }
      const response = await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: targetId, plan: nextPlan }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAdminStatus(payload.error ?? "Failed to update plan.");
        return;
      }
      setAdminStatus(`Plan updated to ${payload.profile?.plan ?? nextPlan}.`);
      await refresh();
    } finally {
      setAdminWorking(false);
    }
  };

  const handleAddMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!memberEmail.trim()) {
      setMemberStatus("Email is required.");
      return;
    }
    setMemberWorking(true);
    setMemberStatus(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setMemberStatus("Sign in again and retry.");
        return;
      }
      const response = await fetch("/api/billing/team-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: memberEmail.trim() }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        setMemberStatus(payload?.error ?? "Failed to add member.");
        return;
      }
      setMemberEmail("");
      setMemberStatus("Team member added.");
      await refreshBilling();
      await refresh();
    } finally {
      setMemberWorking(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setMemberWorking(true);
    setMemberStatus(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setMemberStatus("Sign in again and retry.");
        return;
      }
      const response = await fetch("/api/billing/team-members", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ member_id: memberId }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        setMemberStatus(payload?.error ?? "Failed to remove member.");
        return;
      }
      setMemberStatus("Team member removed.");
      await refreshBilling();
      await refresh();
    } finally {
      setMemberWorking(false);
    }
  };

  const handleManageSubscription = async (
    action: "enable_auto_renew" | "disable_auto_renew" | "cancel_now"
  ) => {
    const confirmationMessage =
      action === "enable_auto_renew"
        ? "Turn auto-renew on for the current plan?"
        : action === "disable_auto_renew"
          ? "Turn auto-renew off? Your plan will stay active until the end of the current billing term."
          : "Cancel this subscription now? You will lose paid access immediately.";

    if (typeof window !== "undefined" && !window.confirm(confirmationMessage)) {
      return;
    }

    setSubscriptionWorking(true);
    setSubscriptionStatus(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setSubscriptionStatus("Sign in again and retry.");
        return;
      }
      const response = await fetch("/api/billing/manage-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;
      if (!response.ok) {
        setSubscriptionStatus(payload?.error ?? "Failed to update subscription.");
        return;
      }
      setSubscriptionStatus(payload?.message ?? "Subscription updated.");
      await refreshBilling();
      await refresh();
    } finally {
      setSubscriptionWorking(false);
    }
  };

  return (
    <div className="relative overflow-hidden py-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#09CEA4]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-32 h-72 w-72 rounded-full bg-[#5BA9FF]/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#09A483]">
                Settings
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0B1220] md:text-4xl">
                Plan &amp; Usage
              </h1>
              <p className="mt-2 text-sm text-[#5B6B82]">
                Manage your plan, limits, and saved queries.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3">
              <span
                className={
                  hasActivePaidAccess || trialPanelVisible
                    ? "rounded-full border border-[#BFECE1] bg-[#EAFBF6] px-3 py-1 text-xs font-semibold text-[#0B6D58]"
                    : "rounded-full border border-[#E6EEF7] bg-white px-3 py-1 text-xs font-semibold text-[#003C79]"
                }
              >
                {subscriptionBadgeLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.08)] md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#0B1220]">
                  Current plan
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#5B6B82]">
                  <span className="inline-flex items-center rounded-full border border-[#BFECE1] bg-[#EAFBF6] px-3 py-1 text-xs font-semibold text-[#0B6D58]">
                    {planLabel}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-[#5B6B82]">
                    <span className={`h-2 w-2 rounded-full ${accessStatusTone}`} />
                    {accessStatusLabel}
                  </span>
                </div>
              </div>
              <div className="text-sm text-[#5B6B82]">
                {profile?.email ?? "Not signed in"}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3 text-sm text-[#5B6B82]">
              {statusMessage}
            </div>

            {trialPanelVisible ? (
              <div className="mt-5 rounded-xl border border-[#BFECE1] bg-[#EAFBF6] px-4 py-3 text-sm text-[#0B6D58]">
                <p className="font-semibold text-[#0B6D58]">Free trial active</p>
                <p className="mt-1">
                  Your trial ends {formatTrialEndDate(trialEndsAt) ?? "soon"}
                  {trialCountdown ? ` (${trialCountdown} left)` : ""}.
                </p>
                <p className="mt-1 text-xs text-[#0B6D58]">
                  Starting a paid plan does not remove the trial banner, but
                  paid billing begins immediately after checkout.
                </p>
              </div>
            ) : null}

            {showPlanOptions ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {(["individual", "team_5", "team_10", "team_unlimited"] as PaidPlanCode[]).map(
                  (planCode) => {
                    const actionLabel = getPlanActionLabel({
                      targetPlanCode: planCode,
                      activeSubscription:
                        subscription?.provider === "paddle" ? subscription : null,
                    });
                    const isCurrentPlan = actionLabel === "Current plan";

                    return (
                      <div
                        key={planCode}
                        className="rounded-xl border border-[#E6EEF7] bg-white p-4"
                      >
                        <p className="text-sm font-semibold text-[#0B1220]">
                          {BILLING_CATALOG[planCode].label}
                        </p>
                        <p className="mt-1 text-xs text-[#5B6B82]">
                          {BILLING_CATALOG[planCode].monthlyPriceLabel}
                        </p>
                        <p className="mt-2 text-xs text-[#5B6B82]">
                          Auto-renew is off by default. Turn it on at checkout
                          or from Settings if you want uninterrupted monthly
                          renewal.
                        </p>
                        {isCurrentPlan ? (
                          <div className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-[#BFECE1] bg-[#EAFBF6] px-4 py-2 text-sm font-semibold text-[#0B6D58]">
                            Current plan
                          </div>
                        ) : (
                          <StartCheckoutButton
                            planCode={planCode}
                            label={actionLabel}
                            fullWidth
                            className="mt-4"
                          />
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            ) : null}

            {hasActivePaidAccess && subscription ? (
              <div className="mt-5 grid gap-4 rounded-xl border border-[#E6EEF7] bg-white p-4 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A8AA1]">
                    Plan
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0B1220]">
                    {isComplimentaryIndividual
                      ? `${currentPaidLabel} (Complimentary)`
                      : currentPaidLabel}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A8AA1]">
                    Billing role
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0B1220]">
                    {billingRole}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A8AA1]">
                    {renewalHeading}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0B1220]">
                    {renewalLabel}
                  </p>
                </div>
              </div>
            ) : null}

            {!hasActivePaidAccess && latestSubscription ? (
              <div className="mt-5 grid gap-4 rounded-xl border border-[#E6EEF7] bg-white p-4 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A8AA1]">
                    Last paid plan
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0B1220]">
                    {BILLING_CATALOG[latestSubscription.plan_code].label}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A8AA1]">
                    Billing status
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0B1220]">
                    {latestSubscription.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A8AA1]">
                    Ended
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0B1220]">
                    {latestSubscription.current_period_end
                      ? new Date(latestSubscription.current_period_end).toLocaleDateString()
                      : "Already closed"}
                  </p>
                </div>
              </div>
            ) : null}

            {subscription && (subscription.cancel_at_period_end || !subscription.auto_renew) ? (
              <div className="mt-4 rounded-xl border border-[#E6EEF7] bg-white px-4 py-3 text-sm text-[#5B6B82]">
                <p className="font-semibold text-[#0B1220]">Switch plans</p>
                <p className="mt-1">
                  Your current access stays active until the end of this term. If you
                  switch plans, the current one will be canceled immediately before the
                  new checkout starts.
                </p>
              </div>
            ) : null}

            {canManageSubscription ? (
              <div className="mt-4 rounded-xl border border-[#E6EEF7] bg-white px-4 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={subscriptionWorking}
                    onClick={() =>
                      void handleManageSubscription(
                        subscription.auto_renew ? "disable_auto_renew" : "enable_auto_renew"
                      )
                    }
                    className="rounded-lg border border-[#E6EEF7] px-4 py-2 text-sm font-semibold text-[#0B1220] transition hover:bg-[#F7FAFC] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {subscription.auto_renew ? "Turn auto-renew off" : "Turn auto-renew on"}
                  </button>
                  <button
                    type="button"
                    disabled={subscriptionWorking}
                    onClick={() => void handleManageSubscription("cancel_now")}
                    className="rounded-lg bg-[#003C79] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#002f60] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Cancel current plan
                  </button>
                </div>
                <p className="mt-3 text-xs text-[#5B6B82]">
                  Turn auto-renew off to let the current plan end at the close of the
                  billing term without another charge. Use cancel only if you want to
                  end the current plan immediately.
                </p>
                {subscriptionStatus ? (
                  <p className="mt-3 text-sm text-[#5B6B82]">{subscriptionStatus}</p>
                ) : null}
              </div>
            ) : null}

          </section>

          <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.08)] md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#0B1220]">Usage</h2>
              <span className="text-xs text-[#5B6B82]">
                Saved queries: {savedCount} / {activePlan.display.savedQueries}
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-[#E6EEF7]">
              <div className={`grid ${isPaidPro ? "grid-cols-2" : "grid-cols-3"} bg-[#F7FAFC] text-xs font-semibold uppercase tracking-[0.2em] text-[#7A8AA1]`}>
                <div className="px-4 py-2">Limit</div>
                <div className="px-4 py-2 text-right">Your plan</div>
                {!isPaidPro ? (
                  <div className="px-4 py-2 text-right">Paid plan</div>
                ) : null}
              </div>
              {[
                ["Max file size", activePlan.display.fileSize, proPlan.display.fileSize],
                ["Total session size", activePlan.display.sessionBudget, proPlan.display.sessionBudget],
                ["Preview rows", activePlan.display.previewRows, proPlan.display.previewRows],
                ["Export rows", activePlan.display.exportRows, proPlan.display.exportRows],
                ["Saved queries", activePlan.display.savedQueries, proPlan.display.savedQueries],
              ].map(([label, mine, pro]) => (
                <div
                  key={label}
                  className={`grid ${isPaidPro ? "grid-cols-2" : "grid-cols-3"} border-t border-[#E6EEF7] text-sm text-[#5B6B82]`}
                >
                  <div className="px-4 py-2">{label}</div>
                  <div className="px-4 py-2 text-right text-[#0B1220]">
                    {mine}
                  </div>
                  {!isPaidPro ? (
                    <div className="px-4 py-2 text-right text-[#0B1220]">
                      {pro}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3 text-sm text-[#5B6B82]">
              <p className="font-semibold text-[#0B1220]">
                Paid plans
              </p>
              <p className="mt-1">
                Individual unlocks full Pro capacity for one user. Team plans add
                owner-managed seats for existing QuackNinja accounts.
              </p>
            </div>
          </section>
        </div>

        {isTeamOwner ? (
          <section className="mt-8 rounded-2xl border border-[#E6EEF7] bg-white/90 p-6 shadow-[0_18px_48px_rgba(11,18,32,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#0B1220]">
                  Team members
                </h2>
                <p className="mt-1 text-sm text-[#5B6B82]">
                  Seats used: {billingData?.seats_used ?? 0}
                  {subscription?.seat_limit !== null
                    ? ` / ${subscription?.seat_limit ?? 0}`
                    : " / Unlimited"}
                </p>
              </div>
            </div>
            <form
              onSubmit={(event) => void handleAddMember(event)}
              className="mt-5 flex flex-col gap-3 md:flex-row"
            >
              <input
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                placeholder="Add existing member by email"
                className="flex-1 rounded-lg border border-[#E6EEF7] bg-white px-3 py-2 text-sm text-[#0B1220] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#09CEA4]"
              />
              <button
                type="submit"
                disabled={memberWorking}
                className={buttonClassName({
                  variant: "primary",
                  className: "disabled:opacity-70",
                })}
              >
                {memberWorking ? "Updating..." : "Add member"}
              </button>
            </form>
            {memberStatus ? (
              <p className="mt-3 text-sm text-[#5B6B82]">{memberStatus}</p>
            ) : null}
            <div className="mt-5 space-y-3">
              {billingLoading ? (
                <p className="text-sm text-[#5B6B82]">Loading team members…</p>
              ) : billingData?.members.length ? (
                billingData.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0B1220]">
                        {member.email ?? "Unknown account"}
                      </p>
                      <p className="text-xs text-[#5B6B82]">
                        Added {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRemoveMember(member.id)}
                      className="rounded-lg border border-[#E6EEF7] px-3 py-1.5 text-xs font-semibold text-[#003C79] transition hover:bg-white"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#5B6B82]">
                  No members assigned yet. Add existing QuackNinja accounts by email.
                </p>
              )}
            </div>
          </section>
        ) : null}

      {isAdmin ? (
        <section
          id="admin"
          className="mt-8 rounded-2xl border border-[#E6EEF7] bg-white/90 p-6 shadow-[0_18px_48px_rgba(11,18,32,0.08)]"
        >
          <h2 className="text-lg font-semibold text-[#0B1220]">Admin</h2>
          <p className="mt-2 text-sm text-[#5B6B82]">
            Update subscription plans for testing. Changes are audited.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-[#5B6B82]">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
              Target user id
              <input
                value={adminTargetId}
                onChange={(event) => setAdminTargetId(event.target.value)}
                placeholder={profile?.id ?? "User id"}
                className="mt-2 w-full rounded-lg border border-[#E6EEF7] bg-white px-3 py-2 text-sm text-[#0B1220] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#09CEA4]"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleAdminSetPlan("pro")}
                disabled={adminWorking}
                className="rounded-lg bg-[#003C79] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#002f60] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Set plan to Pro
              </button>
              <button
                type="button"
                onClick={() => void handleAdminSetPlan("free")}
                disabled={adminWorking}
                className="rounded-lg border border-[#E6EEF7] px-4 py-2 text-sm font-semibold text-[#0B1220] transition hover:bg-[#F7FAFC] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Set plan to Free
              </button>
            </div>
            {adminStatus ? (
              <p className="text-xs text-[#0B1220]">{adminStatus}</p>
            ) : null}
          </div>
        </section>
      ) : null}
      </div>
    </div>
  );
}
