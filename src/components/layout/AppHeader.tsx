"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { usePlan } from "@/src/lib/usePlan";
import { Logo } from "@/src/components/Logo";
import { useAuth } from "@/src/components/auth/AuthProvider";

type AppHeaderProps = {
  variant?: "landing" | "docs";
};

export function AppHeader({ variant = "landing" }: AppHeaderProps) {
  const { plan, loading, trial } = usePlan();
  const { user, loading: authLoading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const planLabel = useMemo(() => {
    if (loading) return "...";
    if (trial?.active) return "Pro trial";
    return plan === "pro" ? "Pro" : "Free";
  }, [loading, plan, trial?.active]);

  const status = authLoading
    ? "loading"
    : user
      ? "in"
      : "out";

  const headerClass =
    variant === "landing"
      ? `fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled
            ? "bg-gradient-to-br from-[#003C79] via-[#00356b] to-[#001f40] backdrop-blur-md border-b border-white/10 shadow-sm shadow-black/10"
            : "bg-transparent"
        }`
      : "sticky top-0 z-50 bg-gradient-to-br from-[#003C79] via-[#00356b] to-[#001f40]";

  const navLinkClass =
    "rounded-md px-2 py-1 text-white/80 transition hover:bg-white/10 hover:text-white";
  const outlineButtonClass =
    "rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10";

  return (
    <div className={headerClass}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        <nav className="flex items-center gap-4 text-sm font-semibold text-white">
          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/" className={navLinkClass}>
              Home
            </Link>
            <Link href="/#pricing" className={navLinkClass}>
              Pricing
            </Link>
            <Link href="/docs" className={navLinkClass}>
              Docs
            </Link>
            {status === "in" ? (
              <>
                <Link href="/app/console" className={navLinkClass}>
                  Console
                </Link>
                <Link href="/app/settings" className={navLinkClass}>
                  Settings
                </Link>
              </>
            ) : null}
          </div>

          {status === "in" ? (
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold text-white">
                {planLabel}
              </span>
              {user?.email ? (
                <span className="hidden max-w-[160px] truncate text-xs text-white/80 md:inline">
                  {user.email}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => supabaseConfigured && supabase.auth.signOut()}
                className={outlineButtonClass}
              >
                Logout
              </button>
            </div>
          ) : !authLoading ? (
            <Link href="/auth/sign-in" className={outlineButtonClass}>
              Sign in
            </Link>
          ) : null}
        </nav>
      </div>
    </div>
  );
}
