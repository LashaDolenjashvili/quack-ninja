import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/src/components/ui/classNames";

type OpenConsoleButtonProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
};

const sizeClasses: Record<NonNullable<OpenConsoleButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export function OpenConsoleButton({
  className,
  size = "md",
  children = "Open Console",
}: OpenConsoleButtonProps) {
  return (
    <Link
      href="/app/console"
      className={cx(
        "inline-flex items-center justify-center rounded-lg bg-[color:var(--color-cta)] font-semibold !text-[color:var(--color-cta-foreground)] transition hover:bg-[color:var(--color-cta-hover)] hover:!text-[color:var(--color-cta-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-cta)]",
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Link>
  );
}
