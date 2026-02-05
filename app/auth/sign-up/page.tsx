"use client";

import Link from "next/link";
import { AuthRedirect } from "@/src/components/auth/AuthRedirect";
import { AuthForm } from "@/src/components/auth/AuthForm";
import { AuthPageLayout } from "@/src/components/auth/AuthPageLayout";

export default function SignUpPage() {
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
        badge="Early access"
        subhead="Pro features are unlocked during early access — your feedback helps us ship v1."
        helper={
          <div className="space-y-1 text-sm text-[color:var(--text-secondary)]">
            <p>No payment details required.</p>
          </div>
        }
      >
        <AuthForm mode="sign-up" />
        <p className="mt-6 text-sm text-[color:var(--text-secondary)]">
          Already have an account?{" "}
          <Link
            href="/auth/sign-in"
            className="font-semibold text-[color:var(--color-primary)]"
          >
            Sign in
          </Link>
        </p>
      </AuthPageLayout>
    </>
  );
}
