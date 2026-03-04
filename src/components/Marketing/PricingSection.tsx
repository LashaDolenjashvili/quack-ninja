"use client";

import { useMemo } from "react";
import Link from "next/link";
import { buttonClassName } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/Card";
import { Section } from "@/src/components/ui/Section";
import { Container } from "@/src/components/ui/Container";
import { SectionHeader } from "@/src/components/Marketing/SectionHeader";
import { getPlanDisplay } from "@/src/lib/planDisplay";
import { usePlan } from "@/src/lib/usePlan";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { OpenConsoleButton } from "@/src/components/Marketing/OpenConsoleButton";
import { StartCheckoutButton } from "@/src/components/billing/StartCheckoutButton";
import { BILLING_CATALOG, type PaidPlanCode } from "@/src/billing/catalog";
import { useBillingSubscription } from "@/src/billing/useBillingSubscription";
import { formatTrialEndDate } from "@/src/lib/trial";

function getPlanActionLabel({
  targetPlanCode,
  currentPlanCode,
}: {
  targetPlanCode: PaidPlanCode;
  currentPlanCode: PaidPlanCode | null;
}) {
  if (targetPlanCode === currentPlanCode) {
    return "Current plan";
  }
  if (targetPlanCode === "individual") {
    return currentPlanCode ? "Switch to Individual" : "Upgrade to Individual";
  }

  const teamLabel =
    targetPlanCode === "team_5"
      ? "Team (5 seats)"
      : targetPlanCode === "team_10"
        ? "Team (10 seats)"
        : "Team (Unlimited)";

  return currentPlanCode ? `Switch to ${teamLabel}` : `Start ${teamLabel}`;
}

export function PricingSection() {
  const { trial } = usePlan();
  const { user, loading: authLoading } = useAuth();
  const { data: billingData } = useBillingSubscription();
  const freePlan = useMemo(() => getPlanDisplay("free"), []);
  const proPlan = useMemo(() => getPlanDisplay("pro"), []);
  const activeSubscription =
    billingData?.subscription?.provider === "paddle"
      ? billingData.subscription
      : null;
  const currentPlanCode = activeSubscription?.plan_code ?? null;
  const trialBanner = trial.active
    ? `You’re currently on trial access. Upgrading starts paid billing immediately and keeps your higher limits uninterrupted.`
    : null;

  return (
    <>
      <Section id="pricing" variant="light">
        <Container className="flex flex-col gap-12">
          <SectionHeader
            kicker="Pricing"
            title="From quick checks to big exports — upgrade when you need it"
            subtitle="Start free, then upgrade for larger files, bigger exports, and unlimited saved queries."
          />

          {trialBanner ? (
            <div className="rounded-2xl border border-[#BFECE1] bg-[#EAFBF6] px-6 py-4 text-sm text-[#0B6D58]">
              <p className="font-semibold text-[#0B6D58]">
                Trial active until {formatTrialEndDate(trial.endsAt) ?? "soon"}
              </p>
              <p className="mt-1">{trialBanner}</p>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card variant="elevated" className="border-slate-200/70 bg-white/80 p-8">
              <div className="inline-flex rounded-full border border-[#D9E3F0] bg-[#F7FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
                Best for trying it first
              </div>
              <h3 className="mt-4 text-xl font-semibold text-[#0B1220]">Free</h3>
              <p className="mt-2 text-3xl font-semibold text-[#0B1220]">
                $0
                <span className="text-sm font-medium text-[#5B6B82]">
                  {" "}
                  forever
                </span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[#5B6B82]">
                <li>Upload files up to {freePlan.display.fileSize}</li>
                <li>Total session size up to {freePlan.display.sessionBudget}</li>
                <li>Preview up to {freePlan.display.previewRows} rows</li>
                <li>Export up to {freePlan.display.exportRows} rows</li>
                <li>{freePlan.display.savedQueries} saved queries</li>
              </ul>
              <p className="mt-4 text-sm text-[#5B6B82]">
                For quick checks, first imports, and validating whether your file
                workflow fits before you commit to larger limits.
              </p>
              <div className="mt-8">
                {authLoading ? (
                  <button
                    type="button"
                    disabled
                    className={buttonClassName({ variant: "outline", fullWidth: true })}
                  >
                    Start free
                  </button>
                ) : user ? (
                  <OpenConsoleButton className="w-full">
                    Open Console (Free)
                  </OpenConsoleButton>
                ) : (
                  <Link
                    href="/auth/sign-up"
                    className={buttonClassName({ variant: "outline", fullWidth: true })}
                  >
                    Start free
                  </Link>
                )}
              </div>
              <p className="mt-3 text-xs text-[#5B6B82]">
                No credit card. 30 seconds to first query.
              </p>
            </Card>

            <Card
              variant="elevated"
              className="relative overflow-hidden border-[#BFD4EC] bg-gradient-to-b from-white to-[#F7FAFC] p-8 shadow-[0_24px_70px_rgba(0,60,121,0.10)]"
            >
              <div className="pointer-events-none absolute -right-12 -top-10 h-32 w-32 rounded-full bg-[#003C79]/8 blur-2xl" />
              <div className="inline-flex rounded-full border border-[#C8DCF2] bg-[#EEF5FC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#003C79]">
                Most popular
              </div>
              <h3 className="mt-4 text-xl font-semibold text-[#0B1220]">Individual</h3>
              <p className="mt-2 text-3xl font-semibold text-[#0B1220]">
                $12
                <span className="text-sm font-medium text-[#5B6B82]"> /month</span>
              </p>
              <p className="mt-3 text-sm font-semibold text-[#0B1220]">
                Bigger files, bigger exports, unlimited saved queries.
              </p>
              <div className="mt-6 rounded-2xl border border-[#DCE7F5] bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A8AA1]">
                  Included limits
                </p>
                <ul className="mt-3 space-y-3 text-sm text-[#5B6B82]">
                  <li>Upload files up to {proPlan.display.fileSize}</li>
                  <li>Total session size up to {proPlan.display.sessionBudget}</li>
                  <li>Preview up to {proPlan.display.previewRows} rows</li>
                  <li>Export up to {proPlan.display.exportRows} rows</li>
                  <li>Unlimited saved queries</li>
                </ul>
              </div>
              <p className="mt-4 text-sm text-[#5B6B82]">
                Higher file, preview, export, and saved-query limits for one
                account, without managing seats.
              </p>
              <div className="mt-8 rounded-2xl border border-[#C8DCF2] bg-[#EEF5FC] p-3">
                {getPlanActionLabel({
                  targetPlanCode: "individual",
                  currentPlanCode,
                }) === "Current plan" ? (
                  <div className="inline-flex w-full items-center justify-center rounded-lg border border-[#BFECE1] bg-[#EAFBF6] px-4 py-2 text-sm font-semibold text-[#0B6D58]">
                    Current plan
                  </div>
                ) : (
                  <StartCheckoutButton
                    planCode="individual"
                    label={getPlanActionLabel({
                      targetPlanCode: "individual",
                      currentPlanCode,
                    })}
                    className="shadow-[0_16px_36px_rgba(0,60,121,0.22)]"
                    fullWidth
                  />
                )}
              </div>
              <p className="mt-3 text-xs text-[#5B6B82]">
                Cancel anytime. Switch plans anytime.
              </p>
            </Card>

            <Card
              variant="elevated"
              className="relative overflow-hidden border-[#BFE5DE] bg-gradient-to-b from-white to-[#F3FBF8] p-8 shadow-[0_24px_70px_rgba(9,206,164,0.08)]"
            >
              <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-[#09CEA4]/10 blur-2xl" />
              <div className="inline-flex rounded-full border border-[#C8ECE2] bg-[#EAFBF6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0B6D58]">
                Best for teams
              </div>
              <h3 className="mt-4 text-xl font-semibold text-[#0B1220]">Team</h3>
              <p className="mt-2 text-3xl font-semibold text-[#0B1220]">
                $39+
                <span className="text-sm font-medium text-[#5B6B82]"> /month</span>
              </p>
              <p className="mt-3 text-sm font-semibold text-[#0B1220]">
                One shared plan — invite teammates and manage seats.
              </p>
              <div className="mt-6 rounded-2xl border border-[#D6EEE8] bg-white/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A8AA1]">
                  Included value
                </p>
                <ul className="mt-3 space-y-3 text-sm text-[#5B6B82]">
                  <li>Each member can upload files up to {proPlan.display.fileSize}</li>
                  <li>Each member gets {proPlan.display.sessionBudget} per session</li>
                  <li>Export up to {proPlan.display.exportRows} rows per member</li>
                  <li>Unlimited saved queries for every assigned member</li>
                  <li>Owner-managed seats</li>
                </ul>
              </div>
              <p className="mt-4 text-sm text-[#5B6B82]">
                One owner manages the plan while each assigned member gets the
                same higher limits as an Individual plan.
              </p>
              <div className="mt-6 rounded-2xl border border-[#C8ECE2] bg-[#EAFBF6] p-3">
                <div className="grid gap-3">
                {(["team_5", "team_10", "team_unlimited"] as PaidPlanCode[]).map(
                  (planCode) =>
                    getPlanActionLabel({
                      targetPlanCode: planCode,
                      currentPlanCode,
                    }) === "Current plan" ? (
                      <div
                        key={planCode}
                        className="inline-flex w-full items-center justify-center rounded-lg border border-[#BFECE1] bg-[#EAFBF6] px-4 py-2 text-sm font-semibold text-[#0B6D58]"
                      >
                        Current plan
                      </div>
                    ) : (
                      <StartCheckoutButton
                        key={planCode}
                        planCode={planCode}
                        label={getPlanActionLabel({
                          targetPlanCode: planCode,
                          currentPlanCode,
                        })}
                        className="shadow-[0_16px_36px_rgba(0,60,121,0.20)]"
                        fullWidth
                      />
                    )
                )}
                </div>
              </div>
              <p className="mt-3 text-xs text-[#5B6B82]">
                Owner manages seats. Add or remove members anytime.
              </p>
            </Card>
          </div>
        <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--color-surface-alt)] px-6 py-4 text-sm text-[color:var(--text-secondary)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#09CEA4]" />
            Session file budget: {freePlan.display.sessionBudget} (Free) /{" "}
            {proPlan.display.sessionBudget} (Pro)
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#09CEA4]" />
            Preview: {freePlan.display.previewRows} rows (Free) /{" "}
            {proPlan.display.previewRows} rows (Pro)
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#09CEA4]" />
            Export: {freePlan.display.exportRows} rows (Free) /{" "}
            {proPlan.display.exportRows} rows (Pro)
          </div>
        </div>
        </Container>
      </Section>
    </>
  );
}
