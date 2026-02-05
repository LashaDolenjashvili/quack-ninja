"use client";

import { useMemo, useState } from "react";
import { Button, buttonClassName } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { Section } from "@/src/components/ui/Section";
import { Container } from "@/src/components/ui/Container";
import { SectionHeader } from "@/src/components/Marketing/SectionHeader";
import { TrialTermsModal } from "@/src/components/Marketing/TrialTermsModal";
import { getPlanDisplay } from "@/src/lib/planDisplay";
import { usePlan } from "@/src/lib/usePlan";
import { getUpgradeHref } from "@/src/lib/upgrade";
import { TRIAL_ENABLED_CLIENT } from "@/src/lib/trial";
import { SQL_DIALECT_LABEL } from "@/src/lib/sqlDialect";

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
      <Section id="pricing" variant="light">
        <Container className="flex flex-col gap-12">
          <SectionHeader
            kicker="Pricing"
            title="Simple plans that scale with your data"
            subtitle="Start free. Upgrade when you need bigger files and share-ready exports."
          />

          <div className="flex flex-wrap items-center gap-4">
            <span
              className={`text-sm font-medium ${
                billing === "monthly" ? "text-[color:var(--text-primary)]" : "text-[color:var(--text-secondary)]"
              }`}
            >
              Monthly
            </span>
            <button
              type="button"
              aria-pressed={billing === "annual"}
              aria-label="Toggle annual billing"
              className="relative h-8 w-14 rounded-full bg-[color:var(--bg-muted)] p-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]"
              onClick={() =>
                setBilling(billing === "monthly" ? "annual" : "monthly")
              }
            >
              <span
                className={`block h-6 w-6 rounded-full bg-[color:var(--color-primary)] transition ${
                  billing === "annual" ? "translate-x-6" : ""
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                billing === "annual" ? "text-[color:var(--text-primary)]" : "text-[color:var(--text-secondary)]"
              }`}
            >
              Annual
            </span>
            {trialEnabled ? (
              <button
                type="button"
                onClick={() => setShowTrialTerms(true)}
                className="ml-2 text-xs font-semibold text-[color:var(--color-primary)]"
              >
                See trial terms
              </button>
            ) : null}
          </div>
          {trialEnabled ? (
            <Card variant="elevated" className="p-6">
              <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                7-day Pro trial
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[color:var(--text-secondary)]">
                <li>Starts when you create an account</li>
                <li>No credit card required</li>
                <li>Ends automatically—keep using Free or upgrade anytime</li>
              </ul>
            </Card>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card variant="elevated" className="p-8">
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
          </Card>

          <Card variant="elevated" className="p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#0B1220]">Pro</h3>
              <Badge tone="accent" className="text-[10px] tracking-[0.2em]">
                {proBadge}
              </Badge>
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
      <TrialTermsModal
        open={showTrialTerms}
        onClose={() => setShowTrialTerms(false)}
      />
    </>
  );
}
