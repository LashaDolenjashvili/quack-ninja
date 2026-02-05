import type { HTMLAttributes } from "react";
import { cx } from "@/src/components/ui/classNames";

type LegalCardProps = HTMLAttributes<HTMLDivElement>;

export function LegalCard({ className, ...props }: LegalCardProps) {
  return (
    <div
      {...props}
      className={cx(
        "rounded-3xl border border-slate-200/60 bg-white/95 p-8 shadow-[0_24px_70px_rgba(2,6,23,0.12)] backdrop-blur sm:p-10 lg:p-12",
        className
      )}
    />
  );
}
