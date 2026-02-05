import type { HTMLAttributes } from "react";
import { cx } from "@/src/components/ui/classNames";

type SectionProps = HTMLAttributes<HTMLElement> & {
  variant?: "light" | "alt" | "dark" | "transparent";
};

const variantClasses: Record<NonNullable<SectionProps["variant"]>, string> = {
  light: "bg-gradient-to-b from-slate-50 to-white",
  alt: "bg-[color:var(--color-surface-alt)]",
  dark: "bg-gradient-to-br from-[#003C79] via-[#00356b] to-[#001f40] text-white",
  transparent: "bg-transparent",
};

export function Section({
  variant = "light",
  className,
  ...props
}: SectionProps) {
  return (
    <section
      {...props}
      className={cx("qn-section", variantClasses[variant], className)}
    />
  );
}
