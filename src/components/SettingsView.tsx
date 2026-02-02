"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { buttonClassName } from "@/src/components/ui/button";
import { usePlan } from "@/src/lib/usePlan";
import { useTrialCountdown } from "@/src/lib/useTrialCountdown";
import { formatTrialEndDate } from "@/src/lib/trial";
import { useConsoleSession } from "@/src/components/ConsoleSessionProvider";
import { getPlanDisplay } from "@/src/lib/planDisplay";
import { getUpgradeHref } from "@/src/lib/upgrade";

export function SettingsView() {
  const { plan, loading, profile, isAdmin, refresh, trial } = usePlan();
  const { savedQueries } = useConsoleSession();
  const savedCount = savedQueries.length;
  const showTrialDebug =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SHOW_TRIAL_DEBUG === "true";
  const [adminTargetId, setAdminTargetId] = useState("");
  const [adminStatus, setAdminStatus] = useState<string | null>(null);
  const [adminWorking, setAdminWorking] = useState(false);
  const planLabel = loading
    ? "Loading..."
    : trial.active
      ? "Pro (Trial)"
      : plan === "pro"
        ? "Pro"
        : "Free";
  const isPaidPro = plan === "pro" && !trial.active;
  const upgradeLabel = loading
    ? "Loading..."
    : isPaidPro
      ? "Billing coming soon"
      : "Upgrade to Pro";
  const upgradeHref = getUpgradeHref(Boolean(profile));
  const freePlan = getPlanDisplay("free");
  const proPlan = getPlanDisplay("pro");
  const activePlan = plan === "pro" ? proPlan : freePlan;
  const trialCountdown = useTrialCountdown(
    trial.serverNow,
    trial.endsAt,
    trial.active
  );
  const trialEndsAtLabel = useMemo(
    () => (trial.active ? formatTrialEndDate(trial.endsAt) : null),
    [trial.active, trial.endsAt]
  );
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

  return (
    <div className="p-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
            Settings
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#0B1220]">
            Plan &amp; Usage
          </h1>
        </div>
        {isPaidPro || loading ? (
          <button
            className={buttonClassName({
              variant: "secondary",
              size: "md",
              className: "cursor-not-allowed",
            })}
            type="button"
            disabled
          >
            {upgradeLabel}
          </button>
        ) : (
          <Link
            href={upgradeHref}
            className={buttonClassName({ variant: "primary", size: "md" })}
          >
            Upgrade to Pro
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border border-[#E6EEF7] bg-white p-6 shadow-[0_18px_48px_rgba(11,18,32,0.08)]">
          <h2 className="text-lg font-semibold text-[#0B1220]">Plan</h2>
          <div className="mt-4 grid gap-4 text-sm text-[#5B6B82]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                Email
              </p>
              <p className="mt-1 text-sm text-[#0B1220]">
                {profile?.email ?? "Not signed in"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                Plan
              </p>
              <p className="mt-1 text-sm text-[#0B1220]">
                {planLabel}
              </p>
              {trial.active ? (
                <p className="mt-1 text-xs text-[#5B6B82]">
                  Trial ends in {trialCountdown ?? "..."}{" "}
                  {trialEndsAtLabel ? `(${trialEndsAtLabel})` : ""}
                </p>
              ) : trial.hasEnded ? (
                <p className="mt-1 text-xs text-[#5B6B82]">
                  Trial ended. You’re on the Free plan.
                </p>
              ) : null}
            </div>
          </div>
          {trial.enabled ? (
            <div className="mt-4 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3 text-xs text-[#5B6B82]">
              <p className="font-semibold text-[#0B1220]">Trial timeline</p>
              <p className="mt-1">
                Started: {trial.startedAt ? formatTrialEndDate(trial.startedAt) : "—"}
              </p>
              <p>
                Ends: {trial.endsAt ? formatTrialEndDate(trial.endsAt) : "—"}
              </p>
              <p>Status: {trial.active ? "Active" : trial.hasEnded ? "Expired" : "—"}</p>
              <p className="mt-1">
                After trial, you’ll be on Free automatically.
              </p>
            </div>
          ) : null}
          {showTrialDebug ? (
            <details className="mt-4 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3 text-xs text-[#5B6B82]">
              <summary className="cursor-pointer font-semibold text-[#0B1220]">
                Trial debug
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-[11px] text-[#0B1220]">
{JSON.stringify(trial, null, 2)}
              </pre>
            </details>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[#E6EEF7] bg-white p-6 shadow-[0_18px_48px_rgba(11,18,32,0.08)]">
          <h2 className="text-lg font-semibold text-[#0B1220]">Usage</h2>
          <div className="mt-4 space-y-3 text-sm text-[#5B6B82]">
            <div className="flex items-center justify-between">
              <span>Saved queries</span>
              <span>
                {savedCount} / {activePlan.display.savedQueries}
              </span>
            </div>
          </div>
          <div className="mt-5 grid gap-4 text-sm text-[#5B6B82] sm:grid-cols-2">
            {[freePlan, proPlan].map((planInfo) => (
              <div
                key={planInfo.tier}
                className={`rounded-xl border px-4 py-3 ${
                  planInfo.tier === plan
                    ? "border-[#003C79]/40 bg-[#EEF4FB]"
                    : "border-[#E6EEF7] bg-[#F7FAFC]"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                  {planInfo.label} limits
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Max single file size</span>
                    <span>{planInfo.display.fileSize}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total session size</span>
                    <span>{planInfo.display.sessionBudget}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Preview rows</span>
                    <span>{planInfo.display.previewRows}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Export rows</span>
                    <span>{planInfo.display.exportRows}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Saved queries</span>
                    <span>{planInfo.display.savedQueries}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {isAdmin ? (
        <section
          id="admin"
          className="mt-6 rounded-2xl border border-[#E6EEF7] bg-white p-6 shadow-[0_18px_48px_rgba(11,18,32,0.08)]"
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
  );
}
