import type { Metadata } from "next";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { PricingSection } from "@/src/components/Marketing/PricingSection";
import { Footer } from "@/src/components/layout/Footer";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Pricing",
  description:
    "Simple plans that scale with your data. Start free, then switch to a paid plan when you need larger limits, exports, or team access.",
  path: "/pricing",
});

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
