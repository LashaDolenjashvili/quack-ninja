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

export function PricingSection() {
  const { plan, loading } = usePlan();
  const { user, loading: authLoading } = useAuth();
  const freePlan = useMemo(() => getPlanDisplay("free"), []);
  const proPlan = useMemo(() => getPlanDisplay("pro"), []);
  const isPaid = !loading && plan === "pro";

  return (
    <>
      <Section id="pricing" variant="light">
        <Container className="flex flex-col gap-12">
          <SectionHeader
            kicker="Pricing"
            title="Simple plans that scale with your data"
            subtitle="Start free. Upgrade to Individual or Team when you need bigger files, bigger exports, and managed paid access."
          />

          <div className="grid gap-6 lg:grid-cols-3">
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
              <div className="mt-8">
                {authLoading ? (
                  <button
                    type="button"
                    disabled
                    className={buttonClassName({ variant: "outline", fullWidth: true })}
                  >
                    Get started
                  </button>
                ) : user ? (
                  <OpenConsoleButton className="w-full" />
                ) : (
                  <Link
                    href="/auth/sign-up"
                    className={buttonClassName({ variant: "outline", fullWidth: true })}
                  >
                    Get started
                  </Link>
                )}
              </div>
              <p className="mt-3 text-xs text-[#5B6B82]">
                Best for trying small imports before you need paid capacity.
              </p>
            </Card>

            <Card variant="elevated" className="p-8">
              <h3 className="text-xl font-semibold text-[#0B1220]">Individual</h3>
              <p className="mt-2 text-3xl font-semibold text-[#0B1220]">
                $12
                <span className="text-sm font-medium text-[#5B6B82]"> /month</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[#5B6B82]">
                <li>Max file: {proPlan.display.fileSize}</li>
                <li>Total session: {proPlan.display.sessionBudget}</li>
                <li>Preview: {proPlan.display.previewRows} rows</li>
                <li>Export: {proPlan.display.exportRows} rows</li>
                <li>Saved queries: {proPlan.display.savedQueries}</li>
              </ul>
              <p className="mt-4 text-sm text-[#5B6B82]">
                Best for solo founders and operators who need full Pro capacity.
              </p>
              <div className="mt-8">
                <StartCheckoutButton
                  planCode="individual"
                  label={isPaid ? "Current paid plan" : "Start Individual"}
                  fullWidth
                />
              </div>
            </Card>

            <Card variant="elevated" className="p-8">
              <h3 className="text-xl font-semibold text-[#0B1220]">Team</h3>
              <p className="mt-2 text-3xl font-semibold text-[#0B1220]">
                $39+
                <span className="text-sm font-medium text-[#5B6B82]"> /month</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[#5B6B82]">
                <li>All Pro limits for every assigned member</li>
                <li>Owner-managed seats</li>
                <li>Existing QuackNinja accounts only in v1</li>
                <li>No shared workspace required</li>
              </ul>
              <div className="mt-6 grid gap-3">
                <StartCheckoutButton
                  planCode="team_5"
                  label="Start Team 5"
                  fullWidth
                />
                <StartCheckoutButton
                  planCode="team_10"
                  label="Start Team 10"
                  fullWidth
                />
                <StartCheckoutButton
                  planCode="team_unlimited"
                  label="Start Team Unlimited"
                  fullWidth
                />
              </div>
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
