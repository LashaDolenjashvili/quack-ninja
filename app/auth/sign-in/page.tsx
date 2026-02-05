import Link from "next/link";
import { AuthRedirect } from "@/src/components/auth/AuthRedirect";
import { AuthForm } from "@/src/components/auth/AuthForm";
import { AuthPageLayout } from "@/src/components/auth/AuthPageLayout";
import { ConfirmEmailNotice } from "@/src/components/auth/ConfirmEmailNotice";

type SignInPageProps = {
  searchParams?: {
    notice?: string | string[];
    email?: string | string[];
  };
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  const notice =
    typeof searchParams?.notice === "string"
      ? searchParams.notice
      : searchParams?.notice?.[0];
  const email =
    typeof searchParams?.email === "string"
      ? searchParams.email
      : searchParams?.email?.[0];
  const showConfirmNotice = notice === "confirm_email";
  return (
    <>
      {/* Checklist:
          - Added top bar + back link
          - Added info panel for trust cues
          - Improved copy + accessibility
      */}
      <AuthRedirect skip={showConfirmNotice} />
      <AuthPageLayout
        title="Sign in"
        subtitle="Welcome back to QuackNinja"
        subhead="Sign in to access your console. Your files stay on your computer."
      >
        <ConfirmEmailNotice notice={notice} email={email} />
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
