"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { cx } from "@/src/components/ui/classNames";
import { Logo } from "@/src/components/Logo";
import { usePathname } from "next/navigation";

export function AuthTopBar() {
  const { user, loading } = useAuth();
  const status = useMemo(
    () => (loading ? "loading" : user ? "in" : "out"),
    [loading, user]
  );

  const pathname = usePathname();
  const consoleHref = status === "in" ? "/app/console" : "/auth/sign-in";
  const showAuthAction = status === "out";
  const isSignUp = pathname?.includes("sign-up") ?? false;

  return (
    <div className="bg-gradient-to-br from-[#003C79] via-[#00356b] to-[#001f40]">
      <div className="qn-container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <Logo showMark={false} />
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm font-semibold text-white sm:gap-3">
          <div className="hidden items-center gap-2 sm:flex sm:gap-3">
            <Link
              href="/"
              className="rounded-md px-2 py-1 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Home
            </Link>
            <Link
              href="/pricing"
              className="rounded-md px-2 py-1 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="rounded-md px-2 py-1 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Docs
            </Link>
          </div>
        {status === "in" ? (
          <Link
            href={consoleHref}
            className={cx(
              "rounded-lg bg-[color:var(--color-cta)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-cta-foreground)] transition hover:bg-[color:var(--color-cta-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-cta)]"
            )}
          >
            Open Console
          </Link>
        ) : showAuthAction ? (
            <Link
              href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}
              className={cx(
                "rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              )}
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </Link>
          ) : null}
        </nav>
      </div>
    </div>
  );
}
