"use client";

import type { ReactNode } from "react";
import { cx } from "@/src/components/ui/classNames";

type BannerTone = "info" | "warning" | "error" | "success";
type BannerVariant = "banner" | "toast";

type BannerProps = {
  children: ReactNode;
  tone?: BannerTone;
  variant?: BannerVariant;
  className?: string;
};

export function Banner({
  children,
  tone = "info",
  variant = "banner",
  className,
}: BannerProps) {
  const toneStyles: Record<BannerTone, string> = {
    info: "border-[#E6EEF7] bg-[#F7FAFC] text-[#5B6B82]",
    warning: "border-[#F7C56A] bg-[#FDF5E8] text-[#7A5B12]",
    error: "border-[#F2C6C6] bg-[#FFF5F5] text-[#9A2E2E]",
    success: "border-[#BFE9DF] bg-[#EAFBF6] text-[#0D6A53]",
  };
  const variants: Record<BannerVariant, string> = {
    banner: "rounded-lg border px-3 py-2 text-xs",
    toast: "rounded-xl border px-4 py-3 text-sm shadow-[0_18px_48px_rgba(11,18,32,0.12)]",
  };

  return (
    <div className={cx(variants[variant], toneStyles[tone], className)}>
      {children}
    </div>
  );
}
