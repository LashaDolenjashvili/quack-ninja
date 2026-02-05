"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocsNavGroup } from "@/src/docs/docsContent";

export function DocsSidebar({ nav }: { nav: DocsNavGroup[] }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-24 hidden w-[270px] shrink-0 rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.08)] lg:block">
      <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#09A483]">
        Browse
      </label>

      <div className="mt-6 space-y-5">
        {nav.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7A8AA1]">
              {group.label}
            </p>
            <nav className="mt-2 space-y-1 text-sm">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 ${
                      isActive
                        ? "bg-[#EAFBF6] text-[#0B6D58] font-semibold"
                        : "text-[#5B6B82] hover:bg-[#F3F7FB]"
                    }`}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
        <div className="mt-8 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] p-4 text-xs text-[#5B6B82]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7A8AA1]">
            Quick links
          </p>
          <div className="mt-3 space-y-2">
            <Link href="/app/console" className="block hover:text-[#003C79]">
              Console
            </Link>
            <Link href="/pricing" className="block hover:text-[#003C79]">
              Pricing
            </Link>
            <Link href="/privacy-policy" className="block hover:text-[#003C79]">
              Privacy
            </Link>
            <a href="mailto:support@quackninja.com" className="block hover:text-[#003C79]">
              Contact
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
