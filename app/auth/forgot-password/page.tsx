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
        helper={
          <p className="text-sm text-[#5B6B82]">
            We’ll email you a link to reset your password.
          </p>
        }
      >
        <PasswordResetForm />
        <p className="mt-6 text-sm text-[#5B6B82]">
          Remembered your password?{" "}
          <Link href="/auth/sign-in" className="font-semibold text-[#003C79]">
            Sign in
          </Link>
        </p>
      </AuthPageLayout>
    </>
  );
}
