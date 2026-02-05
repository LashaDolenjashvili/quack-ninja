import type { Metadata } from "next";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { PricingSection } from "@/src/components/Marketing/PricingSection";
import { Footer } from "@/src/components/layout/Footer";

export const metadata: Metadata = {
  title: "Pricing • QuackNinja",
  description:
    "Simple plans that scale with your data. Start free and upgrade for bigger exports.",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--color-bg)]">
      <AppHeader variant="docs" />
      <main className="flex-1">
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
