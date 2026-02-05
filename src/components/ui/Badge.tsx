import type { HTMLAttributes } from "react";
import { cx } from "@/src/components/ui/classNames";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "primary" | "accent" | "neutral";
};

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  primary:
    "border border-white/30 bg-white/10 text-white/80",
  accent:
    "border border-[#09CEA4]/40 bg-[#09CEA4]/15 text-[#0B1220]",
  neutral:
    "border border-[color:var(--border)] bg-white text-[color:var(--text-secondary)]",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
        toneClasses[tone],
        className
      )}
    />
  );
}
