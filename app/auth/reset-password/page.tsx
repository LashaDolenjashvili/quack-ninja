import Link from "next/link";
import { AuthPageLayout } from "@/src/components/auth/AuthPageLayout";
import { PasswordUpdateForm } from "@/src/components/auth/PasswordUpdateForm";

export default function ResetPasswordPage() {
  return (
    <AuthPageLayout
      title="Reset password"
      subtitle="Choose a new password"
      subhead="Enter your new password to complete the reset."
    >
      <PasswordUpdateForm />
      <p className="mt-6 text-sm text-[color:var(--text-secondary)]">
        Need a fresh link?{" "}
        <Link
          href="/auth/forgot-password"
          className="font-semibold text-[color:var(--color-primary)]"
        >
          Request another reset email
        </Link>
      </p>
    </AuthPageLayout>
  );
}
