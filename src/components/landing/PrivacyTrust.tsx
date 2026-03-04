import Link from "next/link";
import { AuthAwareCta } from "@/src/components/Marketing/AuthAwareCta";
import { Section } from "@/src/components/ui/Section";
import { Container } from "@/src/components/ui/Container";
import { Card } from "@/src/components/ui/Card";

const cards = [
  {
    title: "Local processing",
    body: "Runs in your browser. Your raw files stay on your computer.",
  },
  {
    title: "No uploads required",
    body: "Query and validate data without sending files to a server.",
  },
  {
    title: "Share only what you choose",
    body: "Export just the results you want — you control what leaves your machine.",
  },
];

export function PrivacyTrust() {
  return (
    <Section variant="dark" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#09CEA4]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#09A483]">
            Trust & privacy
          </p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
                Sensitive data? Keep it local.
              </h2>
              <p className="max-w-2xl text-base text-white/80 md:text-lg">
                QuackNinja runs locally, so you can explore sensitive files
                without moving them to a database or BI tool.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <AuthAwareCta
                size="lg"
                showSecondary={false}
                signedOutLabel="Try it with a file"
              />
              <Link
                href="/privacy-policy"
                className="rounded-lg border border-white/25 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Read our privacy details
              </Link>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.title} variant="glass" className="rounded-2xl p-6">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#09CEA4]/15 text-[#09CEA4]">
                <span className="h-2 w-2 rounded-full bg-[#09CEA4]" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {card.body}
              </p>
            </Card>
          ))}
        </div>
        <div className="text-sm text-white/70">
          By default, QuackNinja doesn’t need your files uploaded to run
          queries.
        </div>
      </Container>
    </Section>
  );
}
