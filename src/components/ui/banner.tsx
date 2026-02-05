import type { HTMLAttributes } from "react";
import { cx } from "@/src/components/ui/classNames";

type BannerProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "info" | "warning" | "success";
};

const toneClasses: Record<NonNullable<BannerProps["tone"]>, string> = {
  info: "border-[#B9C9DD] bg-white text-[#0B1220]",
  warning: "border-[#F3D08A] bg-[#FFF6E5] text-[#0B1220]",
  success: "border-[#8EE2C7] bg-[#E9FFF7] text-[#0B1220]",
};

export function Banner({
  tone = "info",
  className,
  ...props
}: BannerProps) {
  return (
    <div
      {...props}
      className={cx(
        "rounded-2xl border px-5 py-4 shadow-[0_12px_32px_rgba(11,18,32,0.06)]",
        toneClasses[tone],
        className
      )}
    />
  );
}
