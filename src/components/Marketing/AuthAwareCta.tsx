"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TRIAL_ENABLED_CLIENT, TRIAL_DAYS } from "@/src/lib/trial";
import { OpenConsoleButton } from "@/src/components/Marketing/OpenConsoleButton";
import { cx } from "@/src/components/ui/classNames";
import { useAuth } from "@/src/components/auth/AuthProvider";

type AuthAwareCtaProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  showSecondary?: boolean;
  signedInExtras?: React.ReactNode;
  signedOutExtras?: React.ReactNode;
};

export function AuthAwareCta({
  size = "md",
  className,
  showSecondary = true,
  signedInExtras,
  signedOutExtras,
}: AuthAwareCtaProps) {
  const { user, loading } = useAuth();
  const status = loading ? "loading" : user ? "in" : "out";

  const signedOutLabel = useMemo(
    () => (TRIAL_ENABLED_CLIENT ? `Start ${TRIAL_DAYS}-day Pro trial` : "Start free"),
    []
  );

  if (status === "loading") {
    return (
      <div className={cx("flex items-center gap-3", className)}>
        <Link
          href="/auth/sign-up"
          className={cx(
            "rounded-lg bg-[color:var(--color-cta)] font-semibold text-[color:var(--color-cta-foreground)] transition hover:bg-[color:var(--color-cta-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-cta)]",
            size === "lg"
              ? "px-5 py-2.5 text-sm"
              : size === "sm"
                ? "px-3 py-1.5 text-xs"
                : "px-4 py-2 text-sm"
          )}
        >
          {signedOutLabel}
        </Link>
        {showSecondary ? (
          <Link
            href="/auth/sign-in"
            className={cx(
              "rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            )}
          >
            Sign in
          </Link>
        ) : null}
      </div>
    );
  }

  if (status === "in") {
    return (
      <div className={cx("flex flex-wrap items-center gap-3", className)}>
        <OpenConsoleButton size={size} />
        {signedInExtras}
      </div>
    );
  }

  return (
    <div className={cx("flex flex-wrap items-center gap-3", className)}>
      <Link
        href="/auth/sign-up"
        className={cx(
          "rounded-lg bg-[color:var(--color-cta)] font-semibold text-[color:var(--color-cta-foreground)] transition hover:bg-[color:var(--color-cta-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-cta)]",
          size === "lg"
            ? "px-5 py-2.5 text-sm"
            : size === "sm"
              ? "px-3 py-1.5 text-xs"
              : "px-4 py-2 text-sm"
        )}
      >
        {signedOutLabel}
      </Link>
      {showSecondary ? (
        <Link
          href="/auth/sign-in"
          className={cx(
            "rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          )}
        >
          Sign in
        </Link>
      ) : null}
      {signedOutExtras}
    </div>
  );
}
