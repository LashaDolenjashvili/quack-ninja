"use client";

import { useMemo } from "react";
import { usePlan } from "@/src/lib/usePlan";
import {
  buildSectionList,
  getDocsPage,
  renderSections,
} from "@/src/docs/docsContent";
import { SQL_DIALECT_LABEL } from "@/src/lib/sqlDialect";

export function DocsPage({ slug }: { slug: string }) {
  const { plan, entitlements } = usePlan();
  const page = useMemo(
    () => getDocsPage(slug, { plan, limits: entitlements }),
    [slug, plan, entitlements]
  );
  const toc = buildSectionList(page.sections);
  const isOverview = page.slug === "overview";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
      <div className="space-y-10">
        <header className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#09A483]">
            Docs
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#0B1220] md:text-4xl">
            {isOverview ? "Documentation" : page.title}
          </h1>
          <p className="mt-3 text-base text-[#5B6B82]">
            {isOverview
              ? `Runs ${SQL_DIALECT_LABEL} locally in your browser for CSV, Excel, and Parquet.`
              : page.description}
          </p>
        </header>

        <div className="space-y-8">{renderSections(page.sections)}</div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7A8AA1]">
              On this page
            </p>
            <nav className="mt-3 space-y-2 text-sm text-[#5B6B82]">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-md px-2 py-1 transition hover:bg-[#F3F7FB] hover:text-[#003C79]"
                >
                  {item.heading}
                </a>
              ))}
            </nav>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-5 text-sm text-[#5B6B82] shadow-[0_20px_60px_rgba(2,6,23,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7A8AA1]">
              Helpful links
            </p>
            <div className="mt-3 space-y-2">
              <a
                href="mailto:support@quackninja.com"
                className="block font-semibold text-[#003C79]"
              >
                Contact support
              </a>
              <a
                href="https://duckdb.org/docs/sql/introduction"
                target="_blank"
                rel="noreferrer"
                className="block text-[#5B6B82] hover:text-[#003C79]"
              >
                Learn DuckDB SQL (external)
              </a>
              <a
                href="/samples/customers.csv"
                className="block text-[#5B6B82] hover:text-[#003C79]"
              >
                Try sample CSVs
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
