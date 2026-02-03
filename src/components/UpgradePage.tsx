"use client";

import { useMemo } from "react";
import { usePlan } from "@/src/lib/usePlan";
import { useTrialCountdown } from "@/src/lib/useTrialCountdown";
import { formatTrialEndDate } from "@/src/lib/trial";
import { useConsoleSession } from "@/src/components/ConsoleSessionProvider";
import { getPlanDisplay } from "@/src/lib/planDisplay";
import { Button } from "@/src/components/ui/button";
import { formatBytes } from "@/src/lib/planLimits";

export function UpgradePage() {
  const { plan, loading, trial } = usePlan();
  const { totalAttachedBytes } = useConsoleSession();
  const freePlan = useMemo(() => getPlanDisplay("free"), []);
  const proPlan = useMemo(() => getPlanDisplay("pro"), []);
  const activePlan = plan === "pro" ? proPlan : freePlan;
  const planLabel = loading
    ? "Checking..."
    : trial.active
      ? "Pro (Trial)"
      : activePlan.label;
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
  const sessionCapBytes = activePlan.limits.maxSessionFileBytes;
  const sessionUsagePercent = Math.min(
    sessionCapBytes > 0 ? totalAttachedBytes / sessionCapBytes : 0,
    1
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="rounded-2xl border border-[#E6EEF7] bg-white p-6 shadow-[0_18px_48px_rgba(11,18,32,0.08)]">
        <h1 className="text-2xl font-semibold text-[#0B1220]">Upgrade</h1>
        <p className="mt-2 text-sm text-[#5B6B82]">
          Unlock higher limits for larger files and exports. Payments are not
          live yet.
        </p>
        {trial.active ? (
          <div className="mt-4 rounded-xl border border-[#BFECE1] bg-[#EAFBF6] px-4 py-3 text-sm text-[#0B1220]">
            <p className="font-semibold text-[#0B6D58]">Pro trial active</p>
            <p className="mt-1 text-sm text-[#0B6D58]">
              Trial ends in {trialCountdown ?? "..."}{" "}
              {trialEndsAtLabel ? `(${trialEndsAtLabel})` : ""}. Upgrade to keep
              Pro limits.
            </p>
          </div>
        ) : null}
          <div className="mt-4 flex flex-col gap-3 text-sm text-[#0B1220]">
            <div className="flex items-center justify-between rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3">
              <span className="font-semibold">Current plan</span>
              <span className="text-[#003C79]">
                {planLabel}
              </span>
            </div>
            <div className="rounded-lg border border-[#E6EEF7] bg-white px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[#0B1220]">
                  Session usage
                </span>
                <span className="text-[#5B6B82]">
                  {formatBytes(totalAttachedBytes)} /{" "}
                  {formatBytes(sessionCapBytes)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E6EEF7]">
                <div
                  className="h-full rounded-full bg-[#09CEA4]"
                  style={{ width: `${sessionUsagePercent * 100}%` }}
                />
              </div>
            </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[#E6EEF7] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                Free limits
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[#0B1220]">
                <li>Max single file: {freePlan.display.fileSize}</li>
                <li>Total session: {freePlan.display.sessionBudget}</li>
                <li>Preview rows: {freePlan.display.previewRows}</li>
                <li>Export rows: {freePlan.display.exportRows}</li>
                <li>Saved queries: {freePlan.display.savedQueries}</li>
              </ul>
            </div>
            <div className="rounded-xl border border-[#9ADBF1] bg-[#F2FAFF] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                Pro limits
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[#0B1220]">
                <li>Max single file: {proPlan.display.fileSize}</li>
                <li>Total session: {proPlan.display.sessionBudget}</li>
                <li>Preview rows: {proPlan.display.previewRows}</li>
                <li>Export rows: {proPlan.display.exportRows}</li>
                <li>Saved queries: {proPlan.display.savedQueries}</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-[#5B6B82]">
            <p className="font-semibold text-[#0B1220]">Why upgrade</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Attach files up to {proPlan.display.fileSize}.</li>
              <li>Export up to {proPlan.display.exportRows} rows.</li>
              <li>Save {proPlan.display.savedQueries} queries.</li>
              <li>Ideal for validating exports before BI or sharing CSVs.</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button type="button" disabled title="Payments coming soon">
            Upgrade to Pro
          </Button>
          <span className="text-xs text-[#5B6B82]">
            Payments coming soon.
          </span>
        </div>
      </div>
    </div>
  );
}
