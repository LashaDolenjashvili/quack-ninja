"use client";

import Link from "next/link";
import { AuthRedirect } from "@/src/components/auth/AuthRedirect";
import { AuthForm } from "@/src/components/auth/AuthForm";
import { AuthPageLayout } from "@/src/components/auth/AuthPageLayout";
import { TrialTermsModal } from "@/src/components/auth/TrialTermsModal";
import { getPlanDisplay } from "@/src/lib/planDisplay";
import { useState } from "react";
import { TRIAL_DAYS } from "@/src/lib/trial";

export default function SignUpPage() {
  const trialEnabled = process.env.NEXT_PUBLIC_TRIAL_ENABLED === "true";
  const [showTrialTerms, setShowTrialTerms] = useState(false);
  const freePlan = getPlanDisplay("free");
  const proPlan = getPlanDisplay("pro");
  return (
    <>
      {/* Checklist:
          - Added top bar + back link
          - Added trial badge + terms modal
          - Added info panel for trust cues
      */}
      <AuthRedirect />
      <AuthPageLayout
        title="Sign up"
        subtitle="Create your QuackNinja account"
        badge={trialEnabled ? `Includes a ${TRIAL_DAYS}-day Pro trial` : null}
        helper={
          trialEnabled ? (
            <div className="space-y-1 text-sm text-[#5B6B82]">
              <p>Start with Pro features for {TRIAL_DAYS} days.</p>
              <p>
                No card required. You’ll switch to Free when the trial ends unless
                you upgrade.
              </p>
              <button
                type="button"
                onClick={() => setShowTrialTerms(true)}
                className="text-sm font-semibold text-[#003C79] hover:text-[#002f60]"
              >
                Trial terms
              </button>
            </div>
          ) : (
            <p className="text-sm text-[#5B6B82]">
              Start with the Free plan and upgrade any time.
            </p>
          )
        }
      >
        <AuthForm mode="sign-up" />
        <p className="mt-6 text-sm text-[#5B6B82]">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="font-semibold text-[#003C79]">
            Sign in
          </Link>
        </p>
      </AuthPageLayout>
      {trialEnabled ? (
        <TrialTermsModal
          open={showTrialTerms}
          onClose={() => setShowTrialTerms(false)}
          trialDays={TRIAL_DAYS}
          proSummary={[
            `Up to ${proPlan.display.fileSize} per file`,
            `Up to ${proPlan.display.exportRows} exported rows`,
            `Up to ${proPlan.display.previewRows} preview rows`,
            `${proPlan.display.savedQueries} saved queries`,
          ]}
          freeSummary={[
            `Up to ${freePlan.display.fileSize} per file`,
            `Up to ${freePlan.display.exportRows} exported rows`,
            `Up to ${freePlan.display.previewRows} preview rows`,
            `${freePlan.display.savedQueries} saved queries`,
          ]}
        />
      ) : null}
    </>
  );
}
