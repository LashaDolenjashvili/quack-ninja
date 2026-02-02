"use client";

import { useMemo, useState } from "react";
import { Button, buttonClassName } from "@/src/components/ui/button";
import { marketingStyles } from "@/src/components/Marketing/marketingStyles";
import { LandingSection } from "@/src/components/Marketing/LandingSection";
import { TrialTermsModal } from "@/src/components/Marketing/TrialTermsModal";
import { getPlanDisplay } from "@/src/lib/planDisplay";
import { usePlan } from "@/src/lib/usePlan";
import { getUpgradeHref } from "@/src/lib/upgrade";
import { TRIAL_ENABLED_CLIENT } from "@/src/lib/trial";

const pricing = {
  monthly: {
    pro: "$12",
    suffix: "/month",
    annualNote: null,
  },
  annual: {
    pro: "$96",
    suffix: "/year",
    annualNote: "$8/mo equivalent",
  },
};

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [showTrialTerms, setShowTrialTerms] = useState(false);
  const active = pricing[billing];
  const { plan, loading, profile } = usePlan();
  const planReady = !loading;
  const isPro = planReady && plan === "pro";
  const proBadge = loading ? "Checking plan..." : isPro ? "Current plan" : "Most popular";
  const proCtaLabel = loading
    ? "Loading..."
    : isPro
      ? "Billing coming soon"
      : "Upgrade to Pro";
  const upgradeHref = getUpgradeHref(Boolean(profile));
  const freePlan = useMemo(() => getPlanDisplay("free"), []);
  const proPlan = useMemo(() => getPlanDisplay("pro"), []);
  const trialEnabled = TRIAL_ENABLED_CLIENT;

  return (
    <>
      <LandingSection id="pricing" variant="surface" innerClassName="flex w-full flex-col gap-10">
        <div className="flex flex-col gap-3">
          <p className={marketingStyles.eyebrow}>Pricing</p>
          <h2 className={marketingStyles.heading}>
            Simple plans that scale with your data
          </h2>
          <p className={marketingStyles.subheading}>
            Start free. Upgrade when you need bigger files and share-ready
            exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`text-sm font-medium ${
              billing === "monthly" ? "text-[#0B1220]" : "text-[#5B6B82]"
            }`}
          >
            Monthly
          </span>
          <button
            type="button"
            aria-pressed={billing === "annual"}
            aria-label="Toggle annual billing"
            className="relative h-8 w-14 rounded-full bg-[#E6EEF7] p-1 transition"
            onClick={() =>
              setBilling(billing === "monthly" ? "annual" : "monthly")
            }
          >
            <span
              className={`block h-6 w-6 rounded-full bg-[#003C79] transition ${
                billing === "annual" ? "translate-x-6" : ""
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              billing === "annual" ? "text-[#0B1220]" : "text-[#5B6B82]"
            }`}
          >
            Annual
          </span>
          {trialEnabled ? (
            <button
              type="button"
              onClick={() => setShowTrialTerms(true)}
              className="ml-2 text-xs font-semibold text-[#003C79]"
            >
              See trial terms
            </button>
          ) : null}
        </div>
        {trialEnabled ? (
          <div className="rounded-2xl border border-[#E6EEF7] bg-[#F7FAFC] px-6 py-4 text-sm text-[#0B1220]">
            <p className="text-sm font-semibold text-[#0B1220]">
              7-day Pro trial
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#5B6B82]">
              <li>Starts when you create an account</li>
              <li>No credit card required</li>
              <li>Ends automatically—keep using Free or upgrade anytime</li>
            </ul>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#E6EEF7] bg-white p-8 shadow-[0_18px_48px_rgba(11,18,32,0.08)]">
            <h3 className="text-xl font-semibold text-[#0B1220]">Free</h3>
            <p className="mt-2 text-3xl font-semibold text-[#0B1220]">
              $0
              <span className="text-sm font-medium text-[#5B6B82]">
                {" "}
                forever
              </span>
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#5B6B82]">
              <li>Max file: {freePlan.display.fileSize}</li>
              <li>Total session: {freePlan.display.sessionBudget}</li>
              <li>Preview: {freePlan.display.previewRows} rows</li>
              <li>Export: {freePlan.display.exportRows} rows</li>
              <li>Saved queries: {freePlan.display.savedQueries}</li>
            </ul>
            <Button
              type="button"
              variant="outline"
              fullWidth
              className="mt-8"
            >
              Get started
            </Button>
            <p className="mt-3 text-xs text-[#5B6B82]">
              Best for trying small exports. Upgrade for share-ready outputs.
            </p>
          </div>

          <div className="rounded-2xl border border-[#9ADBF1] bg-white p-8 shadow-[0_24px_64px_rgba(11,18,32,0.16)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#0B1220]">Pro</h3>
              <span className="rounded-full bg-[#09CEA4]/15 px-3 py-1 text-xs font-semibold text-[#003C79]">
                {proBadge}
              </span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-[#0B1220]">
              {active.pro}
              <span className="text-sm font-medium text-[#5B6B82]">
                {" "}
                {active.suffix}
              </span>
            </p>
            {active.annualNote ? (
              <p className="mt-1 text-sm text-[#09CEA4]">{active.annualNote}</p>
            ) : null}
            <ul className="mt-6 space-y-3 text-sm text-[#5B6B82]">
              <li>Max file: {proPlan.display.fileSize}</li>
              <li>Total session: {proPlan.display.sessionBudget}</li>
              <li>Preview: {proPlan.display.previewRows} rows</li>
              <li>Export: {proPlan.display.exportRows} rows</li>
              <li>Saved queries: {proPlan.display.savedQueries}</li>
            </ul>
            <p className="mt-4 text-sm text-[#5B6B82]">
              Best for weekly exports, larger files, and results you actually
              need to share.
            </p>
            {isPro || loading ? (
              <Button
                type="button"
                variant="secondary"
                fullWidth
                className="mt-8 cursor-not-allowed border-[#E6EEF7] bg-[#F7FAFC] text-[#5B6B82]"
                disabled
              >
                {proCtaLabel}
              </Button>
            ) : (
              <a
                href={upgradeHref}
                className={buttonClassName({
                  variant: "primary",
                  size: "md",
                  fullWidth: true,
                  className: "mt-8 transition hover:bg-[#002f60]",
                })}
              >
                {proCtaLabel}
              </a>
            )}
            <p className="mt-3 text-xs text-[#003C79]">
              Bigger files. Bigger exports. Unlimited saved queries.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#09CEA4]" />
            Works locally in your browser
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#09CEA4]" />
            Files stay on your computer
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#09CEA4]" />
            Export results as CSV
          </span>
        </div>
        <p className="text-sm text-[#5B6B82]">
          Limits keep everything fast and stable in your browser.
        </p>
        <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--color-surface-alt)] px-6 py-4 text-sm text-[color:var(--text-secondary)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#09CEA4]" />
            Works locally in your browser
          </div>
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
      </LandingSection>
      <TrialTermsModal
        open={showTrialTerms}
        onClose={() => setShowTrialTerms(false)}
      />
    </>
  );
}
