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
      ? "Pro Trial"
      : plan === "pro"
        ? "Pro"
        : "Free";
  const isPaidPro = plan === "pro" && !trial.active;
  const upgradeHref = getUpgradeHref(Boolean(profile));
  const freePlan = getPlanDisplay("free");
  const proPlan = getPlanDisplay("pro");
  const activePlan = plan === "pro" ? proPlan : freePlan;
  const trialCountdown = useTrialCountdown(
    trial.serverNow,
    trial.endsAt,
    trial.active,
    trial.startedAt
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
    <div className="relative overflow-hidden py-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#09CEA4]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-32 h-72 w-72 rounded-full bg-[#5BA9FF]/10 blur-3xl" />

      <div className="qn-container relative">
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
          {!isPaidPro && !loading ? (
            <Link
              href={upgradeHref}
              className={buttonClassName({ variant: "primary", size: "md" })}
            >
              Upgrade to Pro
            </Link>
          ) : null}
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
                  {trial.active && trialEndsAtLabel ? (
                    <span className="text-xs text-[#5B6B82]">
                      Ends {trialEndsAtLabel}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="text-sm text-[#5B6B82]">
                {profile?.email ?? "Not signed in"}
              </div>
            </div>

            {trial.active ? (
              <div className="mt-5 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3 text-sm text-[#5B6B82]">
                After your trial, you’ll switch to Free automatically. No card
                required.
              </div>
            ) : trial.hasEnded ? (
              <div className="mt-5 rounded-xl border border-[#F3D2D2] bg-[#FEF5F5] px-4 py-3 text-sm text-[#9C2B2B]">
                Trial ended — you’re on Free now.
              </div>
            ) : null}

            {trial.enabled ? (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#5B6B82]">
                  <span>
                    Started:{" "}
                    {trial.startedAt ? formatTrialEndDate(trial.startedAt) : "—"}
                  </span>
                  <span>
                    Ends: {trial.endsAt ? formatTrialEndDate(trial.endsAt) : "—"}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#E6EEF7]">
                  <div
                    className="h-2 rounded-full bg-[#09CEA4]"
                    style={{
                      width: trial.active
                        ? "70%"
                        : trial.hasEnded
                          ? "100%"
                          : "0%",
                    }}
                  />
                </div>
                {trial.active ? (
                  <div className="text-xs text-[#5B6B82]">
                    {trialCountdown ? `${trialCountdown} left` : "—"}
                  </div>
                ) : null}
              </div>
            ) : null}

            {trial.active && trialCountdown ? (
              Number(trialCountdown.replace(/\D/g, "")) <= 2 ? (
                <div className="mt-4 rounded-xl border border-[#F3D2D2] bg-[#FEF5F5] px-4 py-3 text-sm text-[#9C2B2B]">
                  Trial ends soon — upgrade to keep Pro limits.
                </div>
              ) : null
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

          <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.08)] md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#0B1220]">Usage</h2>
              <span className="text-xs text-[#5B6B82]">
                Saved queries: {savedCount} / {activePlan.display.savedQueries}
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-[#E6EEF7]">
              <div className="grid grid-cols-3 bg-[#F7FAFC] text-xs font-semibold uppercase tracking-[0.2em] text-[#7A8AA1]">
                <div className="px-4 py-2">Limit</div>
                <div className="px-4 py-2 text-right">Your plan</div>
                {!isPaidPro ? (
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
                  className="grid grid-cols-3 border-t border-[#E6EEF7] text-sm text-[#5B6B82]"
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

            {!isPaidPro ? (
              <div className="mt-5 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3 text-sm text-[#5B6B82]">
                <p className="font-semibold text-[#0B1220]">
                  Need bigger exports?
                </p>
                <p className="mt-1">
                  Upgrade to Pro for larger files, previews, and exports.
                </p>
                <Link
                  href={upgradeHref}
                  className={buttonClassName({
                    variant: "primary",
                    size: "sm",
                    className: "mt-3 inline-flex",
                  })}
                >
                  Upgrade to Pro
                </Link>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3 text-sm text-[#5B6B82]">
                You’re on Pro. Manage billing from your account settings.
              </div>
            )}
          </section>
        </div>

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
