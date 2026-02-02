import type { ReactNode } from "react";
import { cx } from "@/src/components/ui/classNames";

type LandingSectionProps = {
  id?: string;
  variant?: "surface" | "alt";
  className?: string;
  innerClassName?: string;
  children: ReactNode;
};

export function LandingSection({
  id,
  variant = "surface",
  className,
  innerClassName,
  children,
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={cx(
        "py-16 md:py-24",
        variant === "alt"
          ? "bg-[color:var(--color-surface-alt)]"
          : "bg-[color:var(--color-surface)]",
        className
      )}
    >
      <div className={cx("mx-auto w-full max-w-6xl px-6", innerClassName)}>
        {children}
      </div>
    </section>
  );
}
