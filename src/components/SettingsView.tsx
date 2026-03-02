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

export function SettingsView() {
  const { plan, loading, profile, isAdmin, refresh, earlyAccess } = usePlan();
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
  const planLabel = loading
    ? "Loading..."
    : earlyAccess
      ? "Pro (Early Access)"
      : plan === "pro"
        ? "Pro"
        : "Free";
  const isPaidPro = plan === "pro";
  const freePlan = getPlanDisplay("free");
  const proPlan = getPlanDisplay("pro");
  const activePlan = plan === "pro" ? proPlan : freePlan;
  const billingSuccess = searchParams?.get("billing") === "success";
  const subscription = billingData?.subscription ?? null;
  const billingRole = billingData?.billing_role ?? "none";
  const isTeamOwner =
    billingRole === "owner" &&
    subscription !== null &&
    subscription.plan_code !== "individual";
  const currentPaidLabel =
    subscription ? BILLING_CATALOG[subscription.plan_code].label : null;
  const isComplimentaryIndividual =
    subscription?.provider === "manual" && subscription.plan_code === "individual";
  const subscriptionBadgeLabel = subscription
    ? isComplimentaryIndividual
      ? `${currentPaidLabel} complimentary`
      : `${currentPaidLabel} active`
    : null;
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
              {subscription ? (
                <span className="rounded-full border border-[#BFECE1] bg-[#EAFBF6] px-3 py-1 text-xs font-semibold text-[#0B6D58]">
                  {subscriptionBadgeLabel}
                </span>
              ) : (
                <span className="rounded-full border border-[#E6EEF7] bg-white px-3 py-1 text-xs font-semibold text-[#003C79]">
                  Billing live
                </span>
              )}
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
                    <span className="h-2 w-2 rounded-full bg-[#09CEA4]" />
                    Active
                  </span>
                </div>
              </div>
              <div className="text-sm text-[#5B6B82]">
                {profile?.email ?? "Not signed in"}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3 text-sm text-[#5B6B82]">
              {billingSuccess
                ? "Paddle checkout completed. Your subscription is being activated. Refresh in a few seconds if needed."
                : isComplimentaryIndividual
                  ? "You are on a complimentary Individual plan while we collect early customer feedback."
                : subscription
                  ? `Subscription status: ${subscription.status}.`
                  : "Choose a paid plan below to unlock Individual or Team billing."}
            </div>

            {!subscription ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {(["individual", "team_5", "team_10", "team_unlimited"] as PaidPlanCode[]).map(
                  (planCode) => (
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
                      <StartCheckoutButton
                        planCode={planCode}
                        label={
                          planCode === "individual"
                            ? "Start Individual"
                            : `Start ${BILLING_CATALOG[planCode].label}`
                        }
                        fullWidth
                        className="mt-4"
                      />
                    </div>
                  )
                )}
              </div>
            ) : null}

            {subscription ? (
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
                    Renewal
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0B1220]">
                    {isComplimentaryIndividual
                      ? "Managed manually"
                      : subscription.current_period_end
                      ? new Date(subscription.current_period_end).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
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
              <div className={`grid ${earlyAccess ? "grid-cols-2" : "grid-cols-3"} bg-[#F7FAFC] text-xs font-semibold uppercase tracking-[0.2em] text-[#7A8AA1]`}>
                <div className="px-4 py-2">Limit</div>
                <div className="px-4 py-2 text-right">
                  {earlyAccess ? "Pro (current)" : "Your plan"}
                </div>
                {!earlyAccess && !isPaidPro ? (
                  <div className="px-4 py-2 text-right">Pro</div>
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
                  className={`grid ${earlyAccess ? "grid-cols-2" : "grid-cols-3"} border-t border-[#E6EEF7] text-sm text-[#5B6B82]`}
                >
                  <div className="px-4 py-2">{label}</div>
                  <div className="px-4 py-2 text-right text-[#0B1220]">
                    {mine}
                  </div>
                  {!earlyAccess && !isPaidPro ? (
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
                Individual and Team plans currently share the same Pro feature limits. Team adds owner-managed seats.
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
