const points = [
  "Runs locally in your browser — files stay on your computer.",
  "No uploads required for analysis.",
  "You control what you export and share.",
];

import { Section } from "@/src/components/ui/Section";
import { Container } from "@/src/components/ui/Container";
import { Card } from "@/src/components/ui/Card";

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
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Private by default
          </h2>
          <p className="max-w-2xl text-base text-white/80 md:text-lg">
            QuackNinja is built for sensitive exports (finance, ops, customer data).
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {points.map((point) => (
            <Card key={point} variant="glass">
              <div className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#09CEA4]" />
                <p className="text-sm leading-relaxed text-white/85">{point}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
