import type { Metadata } from "next";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { PricingSection } from "@/src/components/Marketing/PricingSection";
import { MarketingFooter } from "@/src/components/layout/MarketingFooter";

export const metadata: Metadata = {
  title: "Pricing • QuackNinja",
  description:
    "Simple plans that scale with your data. Start free and upgrade for bigger exports.",
};

export default function PricingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AppHeader variant="docs" />
      <div className="flex-1 pt-24">
        <PricingSection />
      </div>
      <MarketingFooter />
    </main>
  );
}
