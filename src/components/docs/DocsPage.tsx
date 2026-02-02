"use client";

import { useMemo } from "react";
import { usePlan } from "@/src/lib/usePlan";
import {
  buildSectionList,
  getDocsPage,
  renderSections,
} from "@/src/docs/docsContent";

export function DocsPage({ slug }: { slug: string }) {
  const { plan, entitlements } = usePlan();
  const page = useMemo(
    () => getDocsPage(slug, { plan, limits: entitlements }),
    [slug, plan, entitlements]
  );
  const toc = buildSectionList(page.sections);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_220px]">
      <div className="space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
            Docs
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#0B1220]">
            {page.title}
          </h1>
          <p className="mt-3 text-base text-[#5B6B82]">{page.description}</p>
        </header>

        <div className="space-y-8">{renderSections(page.sections)}</div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-xl border border-[#E6EEF7] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
            On this page
          </p>
          <nav className="mt-3 space-y-2 text-sm text-[#4A5A72]">
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block hover:text-[#003C79]"
              >
                {item.heading}
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
}
