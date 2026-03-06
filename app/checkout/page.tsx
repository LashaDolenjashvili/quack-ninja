import { Suspense } from "react";
import { CheckoutLauncherClient } from "./CheckoutLauncherClient";

function CheckoutFallback() {
  return (
    <section className="mx-auto w-full max-w-xl rounded-3xl border border-[#D9E3F0] bg-white px-8 py-10 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#09A483]">
        Secure checkout
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0B1220]">
        Preparing checkout
      </h1>
      <p className="mt-3 text-sm text-[#5B6B82]">Loading your payment session...</p>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#F5F8FC] px-6 py-16">
      <Suspense fallback={<CheckoutFallback />}>
        <CheckoutLauncherClient />
      </Suspense>
    </main>
  );
}
