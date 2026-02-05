type BillingComingSoonNoticeProps = {
  className?: string;
};

export function BillingComingSoonNotice({ className }: BillingComingSoonNoticeProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.08)] ${className ?? ""}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#09A483]">
        Billing
      </p>
      <p className="mt-2 text-lg font-semibold text-[#0B1220]">
        Billing coming soon
      </p>
      <p className="mt-1 text-sm text-[#5B6B82]">
        Payments are being enabled. You can use QuackNinja free in the meantime.
      </p>
    </div>
  );
}
