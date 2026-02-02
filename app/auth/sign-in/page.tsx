import Link from "next/link";
import { AuthRedirect } from "@/src/components/auth/AuthRedirect";
import { AuthForm } from "@/src/components/auth/AuthForm";
import { AuthPageLayout } from "@/src/components/auth/AuthPageLayout";

export default function SignInPage() {
  return (
    <>
      {/* Checklist:
          - Added top bar + back link
          - Added info panel for trust cues
          - Improved copy + accessibility
      */}
      <AuthRedirect />
      <AuthPageLayout
        title="Sign in"
        subtitle="Welcome back to QuackNinja"
        helper={
          <p className="text-sm text-[#5B6B82]">
            Sign in to access your console. Your files stay on your computer.
          </p>
        }
      >
        <AuthForm mode="sign-in" />
        <p className="mt-6 text-sm text-[#5B6B82]">
          Need an account?{" "}
          <Link href="/auth/sign-up" className="font-semibold text-[#003C79]">
            Sign up
          </Link>
        </p>
      </AuthPageLayout>
    </>
  );
}
