import Link from "next/link";
import { AuthRedirect } from "@/src/components/auth/AuthRedirect";
import { AuthForm } from "@/src/components/auth/AuthForm";
import { AuthPageLayout } from "@/src/components/auth/AuthPageLayout";
import { ConfirmEmailNotice } from "@/src/components/auth/ConfirmEmailNotice";

type SignInPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
    email?: string | string[];
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const notice =
    typeof resolvedSearchParams?.notice === "string"
      ? resolvedSearchParams.notice
      : resolvedSearchParams?.notice?.[0];
  const email =
    typeof resolvedSearchParams?.email === "string"
      ? resolvedSearchParams.email
      : resolvedSearchParams?.email?.[0];
  const showConfirmNotice = notice === "confirm_email";
  const showPasswordResetNotice = notice === "password_reset";
  return (
    <>
      {/* Checklist:
          - Added top bar + back link
          - Added info panel for trust cues
          - Improved copy + accessibility
      */}
      <AuthRedirect skip={showConfirmNotice || showPasswordResetNotice} />
      <AuthPageLayout
        title="Sign in"
        subtitle="Welcome back to QuackNinja"
        subhead="Sign in to access your console. Your files stay on your computer."
      >
        <ConfirmEmailNotice notice={notice} email={email} />
        {showPasswordResetNotice ? (
          <div className="mb-4 rounded-xl border border-[#BFECE1] bg-[#EAFBF6] px-4 py-3 text-sm text-[#0B6D58]">
            Your password has been updated. Sign in with your new password.
          </div>
        ) : null}
        <AuthForm mode="sign-in" />
        <p className="mt-6 text-sm text-[color:var(--text-secondary)]">
          Need an account?{" "}
          <Link
            href="/auth/sign-up"
            className="font-semibold text-[color:var(--color-primary)]"
          >
            Sign up
          </Link>
        </p>
      </AuthPageLayout>
    </>
  );
}
