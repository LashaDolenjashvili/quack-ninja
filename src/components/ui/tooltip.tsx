"use client";

import type { ReactNode } from "react";

type TooltipProps = {
  label: string;
  children: ReactNode;
};

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#E6EEF7] bg-white px-2 py-1 text-[11px] text-[#0B1220] opacity-0 shadow-[0_10px_24px_rgba(11,18,32,0.12)] transition group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}
