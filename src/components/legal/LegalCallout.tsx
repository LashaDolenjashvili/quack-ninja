import type { HTMLAttributes } from "react";
import { cx } from "@/src/components/ui/classNames";

type LegalCalloutProps = HTMLAttributes<HTMLDivElement>;

export function LegalCallout({ className, ...props }: LegalCalloutProps) {
  return (
    <div
      {...props}
      className={cx(
        "rounded-2xl border border-[#BFECE1] bg-[#EAFBF6] px-5 py-4 text-sm text-[#0B1220] shadow-[0_16px_40px_rgba(2,6,23,0.08)]",
        className
      )}
    />
  );
}
