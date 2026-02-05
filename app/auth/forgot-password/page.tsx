"use client";

import Link from "next/link";
import { AuthPageLayout } from "@/src/components/auth/AuthPageLayout";
import { PasswordResetForm } from "@/src/components/auth/PasswordResetForm";

export default function ForgotPasswordPage() {
  return (
    <>
      {/* Checklist:
          - Added top bar + back link
          - Added info panel for trust cues
          - Added accessible reset form
      */}
      <AuthPageLayout
        title="Reset password"
        subtitle="Get a reset link"
        subhead="We’ll email you a link to reset your password."
      >
        <PasswordResetForm />
        <p className="mt-6 text-sm text-[color:var(--text-secondary)]">
          Remembered your password?{" "}
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
