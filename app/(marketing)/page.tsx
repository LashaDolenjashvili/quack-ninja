import { PricingSection } from "@/src/components/Marketing/PricingSection";
import { HeroCta } from "@/src/components/Marketing/HeroCta";
import Image from "next/image";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { HowItWorks } from "@/src/components/landing/HowItWorks";
import { QuickWins } from "@/src/components/landing/QuickWins";
import { PrivacyTrust } from "@/src/components/landing/PrivacyTrust";
import { ExampleQueriesSection } from "@/src/components/landing/ExampleQueriesSection";
import { FeatureList } from "@/src/components/ui/FeatureList";
import { Section } from "@/src/components/ui/Section";
import { Container } from "@/src/components/ui/Container";
import { Card } from "@/src/components/ui/Card";
import { SectionHeader } from "@/src/components/Marketing/SectionHeader";
import { Footer } from "@/src/components/layout/Footer";
import { SQL_DIALECT_DESCRIPTION, SQL_DIALECT_LABEL } from "@/src/lib/sqlDialect";
import type { Metadata } from "next";
import {
  buildFaqJsonLd,
  buildMetadata,
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

const faqs = [
  {
    question: "Do my files ever leave my computer?",
    answer:
      "No. QuackNinja runs locally in your browser. Your data stays on your machine unless you choose to export results.",
  },
  {
    question: "What SQL dialect does QuackNinja use?",
    answer: `QuackNinja uses ${SQL_DIALECT_DESCRIPTION}`,
    href: "/docs#sql-snippets",
    linkLabel: "Learn more in Docs",
    badge: SQL_DIALECT_LABEL,
  },
  {
    question: "What file types are supported?",
    answer: `CSV, Excel (.xlsx), and Parquet. You can attach one or multiple files per session and query them like tables.`,
  },
  {
    question: "How do I reference my files in SQL?",
    answer:
      "Each attached file becomes a table name you can query directly (for example: customers, transactions). We also show the table names in the sidebar.",
  },
  {
    question: "Can I join multiple files?",
    answer:
      "Yes — join files in seconds (customers ↔ transactions ↔ payments). DuckDB handles joins, group-bys, and filters locally.",
  },
  {
    question: "Does QuackNinja support window functions and CTEs?",
    answer:
      "Yes. DuckDB SQL supports CTEs (WITH …), window functions (OVER/PARTITION BY), and common analytics patterns.",
  },
  {
    question: "Why are there limits on file size / rows?",
    answer:
      "Because everything runs in your browser. Limits keep performance fast and stable. Paid plans raise the caps for bigger files and exports.",
  },
  {
    question: "Can I export results?",
    answer:
      "Yes. Export any query output to a clean CSV that’s ready to share with teammates or stakeholders.",
  },
  {
    question: "What about Excel sheets — which sheet is used?",
    answer:
      "You can choose a sheet on import. If you don’t select one, we default to the first sheet.",
    href: "/docs/import/excel",
    linkLabel: "Docs: Importing Excel",
  },
  {
    question: "Is there a desktop app?",
    answer:
      "Not yet. QuackNinja is browser-first to stay lightweight and fast. A desktop app may come later.",
  },
];

export const metadata: Metadata = buildMetadata({
  title: "QuackNinja: SQL on CSV, Excel & Parquet",
  description:
    "QuackNinja helps you run SQL on CSV, Excel, and Parquet locally in your browser. Get answers fast, spot issues, and export clean results.",
  path: "/",
  keywords: [
    "QuackNinja",
    "Quack Ninja",
    "SQL on CSV",
    "SQL on Excel",
    "SQL on Parquet",
    "DuckDB in browser",
  ],
});


export default function MarketingPage() {
  const faqJsonLd = buildFaqJsonLd(
    faqs.map((item) => ({ question: item.question, answer: item.answer }))
  );

  const softwareJsonLd = buildSoftwareApplicationJsonLd({
    description:
      "Run SQL on CSV, Excel, and Parquet locally in your browser. Get answers fast and export clean results.",
    includeOffers: true,
  });

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--color-surface)] text-[#0B1220]">
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildWebsiteJsonLd()} />
      <JsonLd data={softwareJsonLd} />
      <JsonLd data={faqJsonLd} />
      <main className="flex-1">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#003C79] via-[#00356b] to-[#001f40] text-white">
        <div className="absolute left-[-120px] top-[-80px] h-72 w-72 rounded-full bg-[#09CEA4]/30 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-6 pb-20 pt-24">
          <AppHeader variant="landing" />

          <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="flex justify-center lg:justify-start">
              <div className="relative isolate">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-16 z-0 rounded-full opacity-70 blur-2xl md:-inset-24"
                  style={{
                    background:
                      "radial-gradient(closest-side at 50% 55%, rgba(0, 210, 255, 0.55), rgba(0, 160, 255, 0.22) 45%, rgba(0, 60, 120, 0.08) 70%, rgba(0, 0, 0, 0) 100%)",
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-10 z-0 rounded-full opacity-50 blur-xl"
                  style={{
                    background:
                      "radial-gradient(closest-side at 50% 60%, rgba(0, 210, 255, 0.45), rgba(0, 120, 255, 0.18) 55%, rgba(0, 0, 0, 0) 100%)",
                  }}
                />
                <div className="relative z-10">
                  <Image
                    src="/brand/quack-ninja.svg"
                    alt="QuackNinja logo"
                    width={520}
                    height={520}
                    className="h-auto w-[320px] md:w-[420px] lg:w-[520px]"
                    style={{
                      imageRendering: "auto",
                      filter: "drop-shadow(0 22px 38px rgba(0,0,0,0.35))",
                    }}
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
                  QuackNinja for quick checks on real files
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#09A483]">
                  Powered by DuckDB
                </span>
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                QuackNinja turns messy exports into answers in minutes.
              </h1>
              <p className="text-lg text-white/90">
                QuackNinja lets you run SQL on CSV, Excel, and Parquet without
                setting up a database. Join files, spot issues, and export a
                clean result your team can use.
              </p>
              <p className="text-sm text-white/80">
                Runs locally in your browser. Your files stay on your computer.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <HeroCta />
              </div>
              <p className="text-xs font-semibold text-white/70">
                Start free, then switch to a paid plan when you need higher
                limits or team access.
              </p>

              <Card variant="glass" className="rounded-3xl p-8">
                <p className="text-base font-semibold text-white/90">
                  Outcomes
                </p>
                <FeatureList
                  tone="dark"
                  className="mt-4 text-[17px] leading-7"
                  items={[
                    "Runs on your computer (files stay local)",
                    "Join files in seconds (customers ↔ transactions)",
                    "Find duplicates, missing values, and odd rows",
                    "Export a clean CSV for stakeholders",
                    "Works even when files are messy",
                  ]}
                />
              </Card>
            </div>
          </section>

          <section className="grid gap-6 rounded-[2rem] border border-white/15 bg-white/8 p-8 backdrop-blur md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7FE3CF]">
                What QuackNinja is
              </p>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                QuackNinja is a browser-based SQL workspace for real exports.
              </h2>
              <p className="max-w-3xl text-base leading-7 text-white/85">
                It is built for operators, analysts, and founders who need fast
                answers from CSV, Excel, or Parquet files without loading data
                into a database first.
              </p>
              <p className="max-w-3xl text-base leading-7 text-white/85">
                Start with the <a href="/docs" className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">QuackNinja docs</a> to learn the workflow, or check <a href="/pricing" className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">QuackNinja pricing</a> if you need larger limits or team access.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-[#02152b]/70 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7FE3CF]">
                How QuackNinja works
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                <li>Attach one or more files directly in the browser.</li>
                <li>Run DuckDB SQL locally on those files.</li>
                <li>Check joins, duplicates, nulls, and strange rows fast.</li>
                <li>Export the cleaned result as CSV for the next step.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>

      <HowItWorks />
      <PricingSection />
      <PrivacyTrust />
      <QuickWins />

      <ExampleQueriesSection />

      <Section variant="light" id="faq">
        <Container className="flex flex-col gap-12">
          <SectionHeader
            kicker="FAQ"
            title="Common questions"
            subtitle="Quick answers to the most common questions."
          />
          <div className="grid gap-6 md:grid-cols-2">
            {faqs.map((item) => (
              <Card key={item.question} variant="elevated" className="p-0">
                <details className="group rounded-2xl p-6">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold text-[color:var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]">
                    <span className="text-lg font-semibold leading-snug">
                      {item.question}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--text-secondary)] transition group-open:rotate-180 group-open:border-[color:var(--color-primary)]">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </summary>
                  <div className="mt-4 border-t border-[color:var(--border)] pt-4 text-sm leading-relaxed text-[color:var(--text-secondary)]">
                    {item.badge ? (
                      <span className="mb-3 inline-flex w-fit items-center rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        {item.badge}
                      </span>
                    ) : null}
                    <p className="text-[15px] leading-7">{item.answer}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-primary)] underline decoration-transparent underline-offset-4 transition hover:decoration-current"
                      >
                        {item.linkLabel ?? "Learn more"}
                      </a>
                    ) : null}
                  </div>
                </details>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      </main>
      <Footer />
    </div>
  );
}
