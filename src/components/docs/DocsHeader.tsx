"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { usePlan } from "@/src/lib/usePlan";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`text-sm font-semibold transition ${
        isActive ? "text-white" : "text-white/80 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export function DocsHeader() {
  const { plan, loading } = usePlan();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    if (!supabaseConfigured) {
      setStatus("out");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus("in");
        setEmail(data.session.user.email ?? null);
      } else {
        setStatus("out");
      }
    });
  }, []);

  const handleLogout = async () => {
    if (supabaseConfigured) {
      await supabase.auth.signOut();
    }
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#003C79]">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/quackninja-mark.png"
            alt="QuackNinja"
            width={48}
            height={48}
            className="h-8 w-8 object-contain md:h-10 md:w-10"
          />
          <Image
            src="/brand/quackninja-wordmark-white.png"
            alt="QuackNinja"
            width={220}
            height={28}
            className="h-5 object-contain sm:h-6 md:h-7"
          />
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          <NavLink href="/" label="Home" />
          <NavLink href="/docs" label="Docs" />
          {status === "in" ? (
            <>
              <NavLink href="/app/console" label="Console" />
              <NavLink href="/app/settings" label="Settings" />
            </>
          ) : null}
        </nav>

        <div className="flex items-center justify-end gap-3">
          {status === "in" ? (
            <>
              <span className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold text-white">
                {loading ? "..." : plan === "pro" ? "Pro" : "Free"}
              </span>
              {email ? (
                <span className="hidden text-xs text-white/80 md:inline">
                  {email}
                </span>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-white/30 px-3 py-1 text-sm font-semibold text-white hover:bg-white/10"
              >
                Logout
              </button>
            </>
          ) : status === "out" ? (
            <Link
              href="/auth/sign-in"
              className="rounded-lg border border-white/30 px-3 py-1 text-sm font-semibold text-white hover:bg-white/10"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
