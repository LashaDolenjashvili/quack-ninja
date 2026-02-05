"use client";

import { useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { Section } from "@/src/components/ui/Section";
import { Container } from "@/src/components/ui/Container";
import { SectionHeader } from "@/src/components/Marketing/SectionHeader";
import { getPlanDisplay } from "@/src/lib/planDisplay";
import { usePlan } from "@/src/lib/usePlan";
import { BillingComingSoonNotice } from "@/src/components/BillingComingSoonNotice";

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
  const active = pricing.monthly;
  const { plan, loading } = usePlan();
  const planReady = !loading;
  const isPro = planReady && plan === "pro";
  const proBadge = loading ? "Checking plan..." : isPro ? "Current plan" : "Most popular";
  const proCtaLabel = "Pro — coming soon";
  const freePlan = useMemo(() => getPlanDisplay("free"), []);
  const proPlan = useMemo(() => getPlanDisplay("pro"), []);

  return (
    <>
      <Section id="pricing" variant="light">
        <Container className="flex flex-col gap-12">
          <BillingComingSoonNotice />
          <SectionHeader
            kicker="Pricing"
            title="Simple plans that scale with your data"
            subtitle="Start free. Upgrade when you need bigger files and share-ready exports."
          />

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
            <p className="mt-1 text-sm text-[#09CEA4]">Billing coming soon.</p>
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
            <Button
              type="button"
              variant="primary"
              fullWidth
              className="mt-8 cursor-not-allowed opacity-80"
              disabled
            >
              {proCtaLabel}
            </Button>
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
    </>
  );
}
