import type { Metadata } from "next";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { PricingSection } from "@/src/components/Marketing/PricingSection";
import { Footer } from "@/src/components/layout/Footer";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "QuackNinja Pricing",
  description:
    "QuackNinja pricing for bigger file limits, exports, and team access. Start free and upgrade when you need more capacity.",
  path: "/pricing",
  keywords: [
    "QuackNinja pricing",
    "QuackNinja plans",
    "SQL on CSV pricing",
  ],
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
