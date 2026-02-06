"use client";

import { AuthAwareCta } from "@/src/components/Marketing/AuthAwareCta";
import { Section } from "@/src/components/ui/Section";
import { Container } from "@/src/components/ui/Container";
import { Card } from "@/src/components/ui/Card";

export function FinalCta() {
  return (
    <Section variant="light">
      <Container>
        <Card
          variant="elevated"
          className="relative overflow-hidden rounded-3xl border-slate-200/60 bg-white/80 p-8 backdrop-blur md:p-12"
        >
          <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-[#09CEA4]/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#003C79]/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-semibold tracking-tight text-[#0B1220] md:text-4xl">
                Get your first answer in under 2 minutes.
              </h2>
              <p className="max-w-2xl text-base text-slate-600 md:text-lg">
                Billing is coming soon. You can use QuackNinja free in the meantime.
              </p>
            </div>
            <AuthAwareCta
              size="lg"
              showSecondary
              className="justify-start md:justify-end"
              signedInExtras={
                <a
                  href="#use-cases"
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                >
                  See example usage
                </a>
              }
              signedOutExtras={
                <a
                  href="#use-cases"
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                >
                  See example usage
                </a>
              }
            />
          </div>
        </Card>
      </Container>
    </Section>
  );
}
