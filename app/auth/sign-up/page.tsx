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
        badge="Free trial"
        subhead="Start with a free trial of Pro limits. Move to a paid plan only when you need ongoing access."
        helper={
          <div className="space-y-1 text-sm text-[color:var(--text-secondary)]">
            <p>No payment details required to get started.</p>
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
