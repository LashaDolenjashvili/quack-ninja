import { AuthCard } from "@/src/components/auth/AuthCard";
import { FeatureList } from "@/src/components/ui/FeatureList";

export function AuthValueCard() {
  return (
    <AuthCard className="bg-white/80">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#09A483]">
        Why QuackNinja?
      </p>
      <FeatureList
        className="mt-4"
        items={[
          "Work with CSV, Excel, and Parquet.",
          "Files stay on your computer.",
          "Export only the results you need.",
        ]}
      />
      <p className="mt-3 text-xs text-[color:var(--text-secondary)]">
        We never upload your files.
      </p>
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">
          Use it for
        </p>
        <ul className="mt-3 space-y-2 text-sm text-[color:var(--text-secondary)]">
          <li>Check an export for missing values or duplicates.</li>
          <li>Combine two exports to answer a question.</li>
          <li>Pull a clean subset to share with a teammate.</li>
        </ul>
      </div>
    </AuthCard>
  );
}
