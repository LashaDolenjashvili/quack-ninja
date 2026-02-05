import { AppHeader } from "@/src/components/layout/AppHeader";
import { Footer } from "@/src/components/layout/Footer";
import { BillingComingSoonPage } from "@/src/components/BillingComingSoonPage";

export default function BillingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--color-bg)]">
      <AppHeader variant="docs" />
      <main className="flex-1">
        <BillingComingSoonPage backHref="/app/console" />
      </main>
      <Footer />
    </div>
  );
}
