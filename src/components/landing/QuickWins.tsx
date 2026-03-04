const wins = [
  {
    title: "Find duplicates",
    body: "Catch repeated customer IDs, invoices, or rows.",
  },
  {
    title: "Validate totals",
    body: "Reconcile sums, fees, refunds, and balances.",
  },
  {
    title: "Join files",
    body: "Combine customers ↔ transactions ↔ payments.",
  },
  {
    title: "Spot weird rows",
    body: "Null spikes, broken dates, strange categories.",
  },
];

import { Section } from "@/src/components/ui/Section";
import { Container } from "@/src/components/ui/Container";

export function QuickWins() {
  return (
    <Section
      id="use-cases"
      variant="transparent"
      className="border-t border-slate-100 bg-white"
    >
      <Container className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#09A483]">
            What you can do in 5 minutes
          </p>
          <h2 className="qn-heading">
            Quick wins on messy files
          </h2>
          <p className="qn-subheading max-w-xl">
            Use QuackNinja when you just need an answer — fast — without spinning
            up a database, notebook, or BI report.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {wins.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200/60 bg-gradient-to-b from-white to-slate-50 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(2,6,23,0.12)]"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#09CEA4]/15 text-[#0B1220]">
                <span className="h-2 w-2 rounded-full bg-[#09CEA4]" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#0B1220]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
