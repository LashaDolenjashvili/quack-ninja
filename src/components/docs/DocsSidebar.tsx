"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { DocsNavGroup } from "@/src/docs/docsContent";
import { docsSearchIndex } from "@/src/docs/docsContent";

export function DocsSidebar({ nav }: { nav: DocsNavGroup[] }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalized) {
      return nav;
    }
    return nav
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.title.toLowerCase().includes(normalized)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [nav, normalized]);
  const matches = useMemo(() => {
    if (!normalized) {
      return [];
    }
    return docsSearchIndex.filter((item) =>
      item.title.toLowerCase().includes(normalized)
    );
  }, [normalized]);

  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-[#E6EEF7] bg-white px-5 py-6 lg:block">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
        Search
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a topic"
          className="mt-2 w-full rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-sm text-[#0B1220] placeholder:text-[#97A3B8]"
        />
      </label>

      <div className="mt-6 space-y-5">
        {normalized ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
              Results
            </p>
            <nav className="mt-2 space-y-1 text-sm">
              {matches.length ? (
                matches.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-[#4A5A72] hover:bg-[#F7FAFC]"
                  >
                    {item.title}
                  </Link>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-[#97A3B8]">
                  No matches found.
                </p>
              )}
            </nav>
          </div>
        ) : (
          filtered.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
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
                          ? "bg-[#EEF4FB] text-[#003C79] font-semibold"
                          : "text-[#4A5A72] hover:bg-[#F7FAFC]"
                      }`}
                    >
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
