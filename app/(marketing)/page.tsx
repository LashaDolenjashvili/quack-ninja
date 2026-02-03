import { PricingSection } from "@/src/components/Marketing/PricingSection";
import { HeroCta } from "@/src/components/Marketing/HeroCta";
import { marketingStyles } from "@/src/components/Marketing/marketingStyles";
import { LandingSection } from "@/src/components/Marketing/LandingSection";
import { AuthAwareCta } from "@/src/components/Marketing/AuthAwareCta";
import { Logo } from "@/src/components/Logo";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { FeatureFlags } from "@/src/config/flags";
import { getPlanDisplay } from "@/src/lib/planDisplay";

const supportsExcel = FeatureFlags.ENABLE_XLSX;
const supportsParquet = FeatureFlags.ENABLE_PARQUET;
const freePlan = getPlanDisplay("free");
const proPlan = getPlanDisplay("pro");
const trialEnabled = process.env.NEXT_PUBLIC_TRIAL_ENABLED === "true";

const formatList = ["CSV"]
  .concat(supportsParquet ? ["Parquet"] : [])
  .concat(supportsExcel ? ["Excel (.xlsx)"] : []);


function joinList(items: string[]) {
  if (items.length === 0) {
    return "";
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

const faqs = [
  {
    question: "Do my files leave my computer?",
    answer:
      "No. QuackNinja runs locally in your browser. Files stay on your computer by default.",
  },
  {
    question: "What formats are supported?",
    answer: joinList(formatList),
  },
  {
    question: "How large can my files be?",
    answer: `Free: ${freePlan.display.fileSize} per file and ${freePlan.display.sessionBudget} per session. Pro: ${proPlan.display.fileSize} per file and ${proPlan.display.sessionBudget} per session.`,
  },
  {
    question: "Why are there limits?",
    answer:
      "Limits keep everything fast in your browser. Pro raises the caps for bigger files and exports.",
  },
  {
    question: "What kind of SQL can I use?",
    answer: "Standard SQL for filters, joins, and totals.",
  },
  {
    question: "Is there a desktop app?",
    answer: "Not yet—QuackNinja is browser-first.",
  },
];

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-[color:var(--color-surface)] text-[#0B1220]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#003C79] via-[#00356b] to-[#001f40] text-white">
        <div className="absolute left-[-120px] top-[-80px] h-72 w-72 rounded-full bg-[#09CEA4]/30 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-20 pt-24">
          <AppHeader variant="landing" />

          <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="flex flex-col gap-6">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
                Made for quick checks on real exports
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Get answers from CSV &amp; Excel exports — fast
              </h1>
              <p className="text-lg text-white/90">
                Drop in one or more exports, run familiar SQL, and share a clean
                result in minutes.
              </p>
              <p className="text-sm text-white/80">
                Works locally in your browser. Files stay on your computer.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <HeroCta />
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#09CEA4]" />
                    Works locally in your browser
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#09CEA4]" />
                    Files stay on your computer
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#09CEA4]" />
                    Export results as CSV
                  </span>
                </div>
              </div>
              {trialEnabled ? (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Includes a 7-day Pro trial. No card.
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/15 p-9 shadow-[0_18px_48px_rgba(0,0,0,0.25)] lg:max-w-[560px]">
              <p className="text-base font-semibold text-white/90">
                Outcomes
              </p>
              <ul className="mt-4 max-w-full space-y-3 text-[17px] leading-7 text-white/95">
                {[
                  "Runs on your computer (files stay local)",
                  "Join exports in seconds (customers + transactions)",
                  "Spot duplicates, missing values, weird rows",
                  "Export a clean CSV for stakeholders",
                  "Works even when exports are messy",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#09CEA4]" />
                    <span className="whitespace-normal break-words leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>

      <LandingSection id="how" variant="surface" innerClassName="flex w-full flex-col gap-10">
          <div className="flex flex-col gap-3">
            <p className={marketingStyles.eyebrow}>How it works</p>
              <h2 className={marketingStyles.heading}>
              SQL in your browser, without the setup
            </h2>
            <p className={marketingStyles.subheading}>
              Attach files, run SQL, export results — all on your machine.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Attach files",
                body: `${joinList(formatList)}. Add multiple files per session.`,
              },
              {
                title: "Ask questions with SQL",
                body: "Filter, join, and summarize your exports in seconds.",
              },
              {
                title: "Export results",
                body: "Download the output you need as a clean CSV — ready to share.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={marketingStyles.card}
              >
                <h3 className={marketingStyles.cardTitle}>{item.title}</h3>
                <p className={marketingStyles.cardBody}>{item.body}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#09CEA4]" />
              Works locally in your browser
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#09CEA4]" />
              Files stay on your computer
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#09CEA4]" />
              Export results as CSV
            </span>
          </div>
      </LandingSection>

      <LandingSection
        id="use-cases"
        variant="alt"
        innerClassName="flex w-full flex-col gap-10"
      >
          <div className="flex flex-col gap-3">
            <p className={marketingStyles.eyebrow}>Use cases</p>
            <h2 className={marketingStyles.heading}>When to use QuackNinja</h2>
            <p className={marketingStyles.subheading}>
              Open it when you have an export and need an answer fast — without
              sending data anywhere.
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
              Runs locally in your browser. Your files stay on your computer.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Before you share an export",
                outcome:
                  "Catch issues in minutes, not after someone replies “this looks wrong.”",
                bullets: [
                  "Find missing values and blanks",
                  "Spot duplicates (IDs, emails, invoice numbers)",
                  "Check odd rows (negative amounts, impossible dates)",
                ],
                examples: [
                  {
                    label: "Missing values by column",
                    code:
                      "SELECT\n  COUNT(*) AS rows,\n  SUM(CASE WHEN email IS NULL THEN 1 ELSE 0 END) AS missing_email\nFROM customers;",
                  },
                  {
                    label: "Duplicates by customer_id",
                    code:
                      "SELECT customer_id, COUNT(*) AS dupes\nFROM customers\nGROUP BY customer_id\nHAVING COUNT(*) > 1\nORDER BY dupes DESC;",
                  },
                ],
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-[#003C79]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                ),
              },
              {
                title: "When two files need to match",
                outcome:
                  "Combine exports without spreadsheets or manual copy/paste.",
                bullets: [
                  "Join customers + transactions",
                  "Merge product list + sales export",
                  "Compare two exports to see what changed",
                ],
                examples: [
                  {
                    label: "Join and summarize totals",
                    code:
                      "SELECT c.segment, SUM(o.amount) AS total\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nGROUP BY c.segment\nORDER BY total DESC;",
                  },
                ],
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-[#003C79]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13" />
                    <path d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 1 1-7-7L7 11" />
                  </svg>
                ),
              },
              {
                title: "When you need one number you can trust",
                outcome:
                  "Confirm totals before a report, invoice, or meeting.",
                bullets: [
                  "Recalculate totals by date / region / owner",
                  "Validate a dashboard number from an export",
                  "Quick “does this reconcile?” checks",
                ],
                examples: [
                  {
                    label: "Group by month and sum",
                    code:
                      "SELECT DATE_TRUNC('month', order_date) AS month,\n  SUM(amount) AS total\nFROM orders\nGROUP BY month\nORDER BY month;",
                  },
                ],
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-[#003C79]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 3h14a2 2 0 0 1 2 2v4H3V5a2 2 0 0 1 2-2Z" />
                    <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
                    <path d="M7 13h2" />
                    <path d="M11 13h2" />
                    <path d="M7 17h2" />
                    <path d="M11 17h2" />
                  </svg>
                ),
              },
              {
                title: "When you need a clean subset to send",
                outcome:
                  "Export a share-ready CSV with only what matters.",
                bullets: [
                  "Filter to last 30 days / one region / one customer",
                  "Keep only columns stakeholders need",
                  "Export results as a new CSV (query output)",
                ],
                examples: [
                  {
                    label: "Filter + select columns",
                    code:
                      "SELECT order_id, customer_id, amount\nFROM orders\nWHERE order_date >= CURRENT_DATE - INTERVAL '30 days';",
                  },
                ],
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-[#003C79]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M3 5h18l-7 8v5l-4 2v-7Z" />
                  </svg>
                ),
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 shadow-[0_12px_32px_rgba(11,18,32,0.08)] transition hover:-translate-y-0.5 hover:border-[#B9C9DD] hover:shadow-[0_18px_48px_rgba(11,18,32,0.12)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF4FB]">
                    {card.icon}
                  </div>
                  <h3 className="text-base font-semibold text-[color:var(--text-primary)]">
                    {card.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm font-semibold text-[#003C79]">
                  {card.outcome}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-[color:var(--text-secondary)]">
                  {card.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#09CEA4]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <details className="mt-4 rounded-xl border border-[color:var(--border)] bg-[#F7FAFC] px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                  <summary className="cursor-pointer font-semibold text-[color:var(--text-primary)]">
                    Example query
                  </summary>
                  <div className="mt-3 space-y-3">
                    {card.examples.map((example) => (
                      <div key={example.label}>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
                          {example.label}
                        </p>
                        <pre className="mt-2 overflow-auto rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-xs text-[#0B1220]">
                          <code>{example.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--border)] bg-white px-6 py-4">
            <p className="text-sm font-semibold text-[color:var(--text-secondary)]">
              Tip: If your export is too big to preview or export, that’s what
              Pro is for.
            </p>
            <div className="flex items-center gap-3">
              <AuthAwareCta showSecondary />
              <a
                href="#pricing"
                className="rounded-lg border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[#003C79]"
              >
                See pricing
              </a>
            </div>
          </div>
      </LandingSection>

      <PricingSection />

      <LandingSection id="faq" variant="alt" innerClassName="flex w-full flex-col gap-10">
          <div className="flex flex-col gap-3">
            <p className={marketingStyles.eyebrow}>FAQ</p>
            <h2 className={marketingStyles.heading}>Common questions</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {faqs.map((item) => (
              <div
                key={item.question}
                className={marketingStyles.card}
              >
                <h3 className="text-base font-semibold text-[#0B1220]">
                  {item.question}
                </h3>
                <p className={marketingStyles.cardBody}>{item.answer}</p>
              </div>
            ))}
          </div>
      </LandingSection>

      <footer className="bg-[#002D5A] py-10 text-white">
        <div className="h-px w-full bg-gradient-to-r from-white/0 via-white/15 to-white/0" />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            <Logo showText />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/80">
            <a
              href="#how"
              className="rounded-sm text-white/85 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="rounded-sm text-white/85 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="rounded-sm text-white/85 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              FAQ
            </a>
            <a
              href="/terms"
              className="rounded-sm text-white/85 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Terms
            </a>
            <a
              href="/auth/sign-in"
              className="rounded-sm text-white/85 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Sign in
            </a>
          </div>
          <p className="text-xs text-white/70">
            Runs in your browser. Files stay on your computer.
          </p>
        </div>
      </footer>
    </main>
  );
}
