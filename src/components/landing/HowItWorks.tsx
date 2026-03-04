import { AuthAwareCta } from "@/src/components/Marketing/AuthAwareCta";
import { cx } from "@/src/components/ui/classNames";
import { Section } from "@/src/components/ui/Section";
import { Container } from "@/src/components/ui/Container";
import { SQL_DIALECT_LABEL } from "@/src/lib/sqlDialect";

const steps = [
  {
    step: "01",
    title: "Drop in your files",
    body: "Import CSV, Excel (.xlsx), or Parquet — add multiple files per session.",
  },
  {
    step: "02",
    title: "Query with SQL",
    body: "Filter, join, group, and validate fast — without setting up a database.",
  },
  {
    step: "03",
    title: "Export & share",
    body: "Download a clean, share-ready CSV your team can trust.",
  },
];

export function HowItWorks() {
  return (
    <Section variant="light">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#09A483]">
            How it works
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-3">
              <h2 className="qn-heading">
                SQL on your files — instantly, in the browser
              </h2>
              <p className="qn-subheading max-w-2xl">
                Upload CSV/Excel/Parquet, run familiar SQL, export clean
                results for your team in minutes.
              </p>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#09A483]">
                Powered by {SQL_DIALECT_LABEL}
              </p>
            </div>
            <AuthAwareCta
              size="lg"
              showSecondary={false}
              signedOutLabel="Try it free"
              className="justify-start lg:justify-end"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((item) => (
            <div
              key={item.step}
              className={cx(
                "group rounded-2xl border border-slate-200/60 bg-gradient-to-b from-white to-slate-50 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(2,6,23,0.12)]"
              )}
            >
              <span className="inline-flex items-center rounded-full border border-[#09CEA4]/40 bg-[#09CEA4]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#0B1220]">
                {item.step}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-[#0B1220]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.body}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#7B8AA5]">
                Step {item.step}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
