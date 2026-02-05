"use client";

import { useState } from "react";
import { AuthAwareCta } from "@/src/components/Marketing/AuthAwareCta";
import { Section } from "@/src/components/ui/Section";
import { Container } from "@/src/components/ui/Container";
import { Card } from "@/src/components/ui/Card";
import { EXAMPLE_QUERIES } from "@/src/lib/exampleQueries";
import { SQL_DIALECT_LABEL, SQL_DIALECT_SHORT } from "@/src/lib/sqlDialect";

const SAMPLE_URLS = [
  "/samples/customers.csv",
  "/samples/transactions.csv",
  "/samples/payments.csv",
];
const SAMPLE_FILES = [
  { label: "customers.csv", href: "/samples/customers.csv" },
  { label: "transactions.csv", href: "/samples/transactions.csv" },
  { label: "payments.csv", href: "/samples/payments.csv" },
];
const SQL_KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "LEFT",
  "RIGHT",
  "FULL",
  "OUTER",
  "INNER",
  "ON",
  "GROUP",
  "BY",
  "HAVING",
  "ORDER",
  "LIMIT",
  "WITH",
  "AS",
  "COUNT",
  "SUM",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "COALESCE",
  "OVER",
  "PARTITION",
]);

export function ExampleQueriesSection() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = async (sql: string, index: number) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(sql);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1200);
    } catch {
      setCopiedIndex(null);
    }
  };

  const downloadAllSamples = () => {
    if (typeof document === "undefined") {
      return;
    }
    setDownloading(true);
    for (const url of SAMPLE_URLS) {
      const a = document.createElement("a");
      a.href = url;
      a.download = url.split("/").pop() ?? "sample.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => setDownloading(false), 1000);
  };

  const renderSql = (sql: string) => {
    const pattern =
      /'[^']*'|\b\d+(?:\.\d+)?\b|\b(?:SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|FULL|OUTER|INNER|ON|GROUP|BY|HAVING|ORDER|LIMIT|WITH|AS|COUNT|SUM|CASE|WHEN|THEN|ELSE|END|COALESCE|OVER|PARTITION)\b/gi;
    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(sql)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(sql.slice(lastIndex, match.index));
      }
      const token = match[0];
      const upper = token.toUpperCase();
      if (token.startsWith("'")) {
        nodes.push(
          <span key={`${match.index}-str`} className="text-[#0B6D58]">
            {token}
          </span>
        );
      } else if (SQL_KEYWORDS.has(upper)) {
        nodes.push(
          <span key={`${match.index}-kw`} className="text-[#003C79]">
            {token}
          </span>
        );
      } else {
        nodes.push(
          <span key={`${match.index}-num`} className="text-[#9A6B00]">
            {token}
          </span>
        );
      }
      lastIndex = match.index + token.length;
    }
    if (lastIndex < sql.length) {
      nodes.push(sql.slice(lastIndex));
    }
    return nodes;
  };

  return (
    <Section variant="light" id="example-queries">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#09A483]">
            Example queries
          </p>
          <h2 className="qn-heading">Get your first answer in under 2 minutes.</h2>
          <p className="qn-subheading max-w-xl">
            Attach exports, run SQL, and export a clean result — without setting up a
            database.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <AuthAwareCta
              size="lg"
              showSecondary={false}
            />
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.08)] backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#09A483]">
              Try it with sample data
            </p>
            <h3 className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">
              Load the demo tables in one click
            </h3>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
              Creates 3 tables: customers, transactions, payments.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-secondary)]">
              <span className="rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                Runs locally
              </span>
              <span className="rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                No uploads
              </span>
              <span className="rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                Matches the queries below
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={downloadAllSamples}
                disabled={downloading}
                className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-xs font-semibold text-[color:var(--color-primary)] transition hover:bg-[color:var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {downloading ? "Downloading…" : "Download CSVs"}
              </button>
              <span className="text-xs text-[color:var(--text-secondary)]">
                If your browser blocks multiple downloads, click each file below.
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[color:var(--text-secondary)]">
                Individual files:
              </span>
              {SAMPLE_FILES.map((file) => (
                <a
                  key={file.href}
                  href={file.href}
                  download
                  className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-xs font-semibold text-[color:var(--color-primary)] transition hover:bg-[color:var(--bg-muted)]"
                >
                  {file.label}
                </a>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[color:var(--text-secondary)]">
              <span className="rounded-full border border-slate-200/70 bg-slate-50 px-2.5 py-1">
                1 Load tables
              </span>
              <span className="text-[color:var(--text-secondary)]">→</span>
              <span className="rounded-full border border-slate-200/70 bg-slate-50 px-2.5 py-1">
                2 Run a query
              </span>
              <span className="text-[color:var(--text-secondary)]">→</span>
              <span className="rounded-full border border-slate-200/70 bg-slate-50 px-2.5 py-1">
                3 Export CSV
              </span>
            </div>
            <p className="mt-3 text-xs text-[color:var(--text-secondary)]">
              Runs locally — sample files never uploaded.
            </p>
          </div>
          <p className="text-sm text-[color:var(--text-secondary)]">
            Runs locally in your browser. Files stay on your computer.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#09A483]">
            <span>Examples use {SQL_DIALECT_LABEL}.</span>
            <a
              href="/docs#sql-dialect"
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-primary)] underline decoration-transparent underline-offset-4 transition hover:decoration-current"
            >
              DuckDB SQL reference
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[color:var(--text-primary)]">
              Try these 4 queries
            </p>
            <span className="text-xs text-[color:var(--text-secondary)]">
              Works on CSV / Excel / Parquet ({SQL_DIALECT_SHORT})
            </span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {EXAMPLE_QUERIES.map((item, index) => (
              <Card
                key={item.title}
                variant="elevated"
                className="p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                      {item.outcome}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.sql, index)}
                    className="rounded-lg border border-[color:var(--border)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-primary)] transition hover:bg-[color:var(--bg-muted)]"
                    aria-label={`Copy query: ${item.title}`}
                  >
                    {copiedIndex === index ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-xl border border-[color:var(--border)] bg-[#F7FAFC] p-3 text-[11px] leading-relaxed text-[#0B1220]">
                  <code className="font-mono">{renderSql(item.sql)}</code>
                </pre>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
                    Works on CSV / Excel / Parquet
                  </p>
                  <a
                    href={`/app/console?example=${item.id}`}
                    className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-primary)] underline decoration-transparent underline-offset-4 transition hover:decoration-current"
                  >
                    Open in Console
                  </a>
                </div>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-xs text-[color:var(--text-secondary)]">
            Tip: Files become tables automatically (e.g., customers,
            transactions).
          </p>
        </div>
      </Container>
    </Section>
  );
}
