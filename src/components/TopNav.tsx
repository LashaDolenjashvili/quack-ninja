"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigured } from "@/src/lib/supabaseClient";

type TopNavProps = {
  linkClassName?: string;
  buttonClassName?: string;
  containerClassName?: string;
};

export function TopNav({
  linkClassName = "text-sm font-semibold text-[#003C79] hover:text-[#002f60]",
  buttonClassName = "rounded-lg border border-[#E6EEF7] px-4 py-2 text-sm font-semibold text-[#003C79]",
  containerClassName = "flex items-center gap-4",
}: TopNavProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    if (!supabaseConfigured) {
      setStatus("out");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "in" : "out");
    });
  }, []);

  const handleLogout = async () => {
    if (supabaseConfigured) {
      await supabase.auth.signOut();
    }
    setStatus("out");
    router.replace("/");
    router.refresh();
  };

  return (
    <nav className={containerClassName}>
      <Link href="/" className={linkClassName}>
        Home
      </Link>
      <Link href="/#pricing" className={linkClassName}>
        Pricing
      </Link>
      <Link href="/docs" className={linkClassName}>
        Docs
      </Link>
      {status === "in" ? (
        <>
          <Link href="/app/console" className={linkClassName}>
            Console
          </Link>
          <Link href="/app/settings" className={linkClassName}>
            Settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={`${buttonClassName} cursor-pointer`}
          >
            Logout
          </button>
        </>
      ) : status === "out" ? (
        <Link href="/auth/sign-in" className={buttonClassName}>
          Sign in
        </Link>
      ) : null}
    </nav>
  );
}
