"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/src/components/Logo";
import { Button } from "@/src/components/ui/button";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";
import { docsNav } from "@/src/docs/docsContent";

type SidebarProps = {
  userEmail?: string | null;
  planLabel?: string;
};

export function Sidebar({
  userEmail,
  planLabel = "Free",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isConsole = pathname.startsWith("/app/console") || pathname === "/app";
  const isDocs = pathname.startsWith("/docs");
  const isSettings = pathname.startsWith("/app/settings");

  const handleLogout = async () => {
    if (supabaseConfigured) {
      await supabase.auth.signOut();
    }
    setShowLogout(false);
    router.replace("/");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const modal = mounted && showLogout
    ? createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1220]/40 px-6 py-10">
          <div className="w-full max-w-sm rounded-2xl border border-[#E6EEF7] bg-white p-6 text-[#0B1220] shadow-[0_18px_48px_rgba(11,18,32,0.18)]">
            <h2 className="text-lg font-semibold">Logout?</h2>
            <p className="mt-2 text-sm text-[#5B6B82]">
              You can sign back in anytime.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowLogout(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <aside className="sticky top-0 flex h-screen w-[260px] flex-col bg-[#003C79] text-white">
        <div className="px-5 pt-6">
          <Logo showMark={false} />
        </div>

        <div className="mt-8 flex min-h-0 flex-1 flex-col gap-6 px-5">
          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Navigation
            </p>
            <Link
              href="/"
              className="mt-4 block w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10"
            >
              Home
            </Link>
            <Link
              href="/app/console"
              className={`mt-2 block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                isConsole
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              Console
            </Link>
          <Link
            href="/docs"
            className={`mt-2 block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
              isDocs
                ? "bg-white/15 text-white"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            Docs
          </Link>
          <Link
            href="/app/settings"
            className={`mt-2 block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
              isSettings
                ? "bg-white/15 text-white"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            Settings
          </Link>
        </div>

          {isDocs ? (
            <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Docs
              </p>
              <div className="mt-4 space-y-5">
                {docsNav.map((group) => (
                  <div key={group.label}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                      {group.label}
                    </p>
                    <nav className="mt-2 space-y-1 text-sm">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`block rounded-lg px-3 py-2 transition ${
                              isActive
                                ? "bg-white/15 font-semibold text-white"
                                : "text-white/80 hover:bg-white/10"
                            }`}
                          >
                            {item.title}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-sm font-semibold text-white">
                Paid plans
              </p>
              <p className="mt-2 text-xs text-white/70">
                Switch between Individual and Team plans from Settings.
                Auto-renew is optional.
              </p>
              <Link
                href={userEmail ? "/app/settings" : "/pricing"}
                className="mt-4 block w-full rounded-lg bg-white/20 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-white/25"
              >
                {userEmail ? "Manage billing" : "View pricing"}
              </Link>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
              {userEmail ? userEmail[0]?.toUpperCase() : "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-white/70">
                {userEmail ?? "Signed out"}
              </span>
              <span className="text-sm font-semibold text-white">{planLabel}</span>
            </div>
          </div>
          {userEmail ? (
            <button
              type="button"
              onClick={() => setShowLogout(true)}
              className="mt-4 w-full cursor-pointer rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/auth/sign-in"
              className="mt-4 block w-full rounded-lg border border-white/20 px-3 py-2 text-center text-xs font-semibold text-white/80 transition hover:bg-white/10"
            >
              Sign in
            </Link>
          )}
        </div>
      </aside>
      {modal}
    </>
  );
}
