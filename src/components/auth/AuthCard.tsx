import type { HTMLAttributes } from "react";
import { cx } from "@/src/components/ui/classNames";

type AuthCardProps = HTMLAttributes<HTMLDivElement>;

export function AuthCard({ className, ...props }: AuthCardProps) {
  return (
    <div
      {...props}
      className={cx(
        "rounded-3xl border border-slate-200/60 bg-white/90 p-8 shadow-[0_24px_70px_rgba(2,6,23,0.12)] backdrop-blur",
        className
      )}
    />
  );
}
