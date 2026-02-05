import type { HTMLAttributes } from "react";
import { cx } from "@/src/components/ui/classNames";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "elevated" | "glass" | "outline";
};

const variantClasses: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "qn-card",
  elevated:
    "qn-card-elevated hover:-translate-y-0.5 hover:shadow-[0_28px_80px_rgba(2,6,23,0.14)]",
  glass:
    "rounded-2xl border border-white/20 bg-white/15 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.25)] backdrop-blur",
  outline: "rounded-2xl border border-[color:var(--border)] bg-transparent p-6",
};

export function Card({ variant = "default", className, ...props }: CardProps) {
  return <div {...props} className={cx(variantClasses[variant], className)} />;
}
