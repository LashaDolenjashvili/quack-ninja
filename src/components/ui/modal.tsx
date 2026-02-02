"use client";

import type { ReactNode } from "react";
import { cx } from "@/src/components/ui/classNames";
import { typography } from "@/src/components/ui/tokens";

type ModalOverlayProps = {
  children: ReactNode;
  className?: string;
};

type ModalContentProps = {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
};

type ModalHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  actions?: ReactNode;
};

type ModalFooterProps = {
  children: ReactNode;
  className?: string;
  align?: "end" | "between";
};

export function ModalOverlay({ children, className }: ModalOverlayProps) {
  return (
    <div
      className={cx(
        "fixed inset-0 z-50 flex items-center justify-center bg-[#0B1220]/40 px-6 py-10",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ModalContent({ children, size = "md", className }: ModalContentProps) {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
  };
  return (
    <div
      className={cx(
        "w-full rounded-2xl border border-[#E6EEF7] bg-white p-6 shadow-[0_18px_48px_rgba(11,18,32,0.18)]",
        sizes[size],
        className
      )}
    >
      {children}
    </div>
  );
}

export function ModalHeader({ title, description, className, actions }: ModalHeaderProps) {
  return (
    <div className={cx("flex items-start justify-between gap-4", className)}>
      <div>
        <h2 className={typography.headingLg}>{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-[#5B6B82]">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function ModalFooter({ children, align = "end", className }: ModalFooterProps) {
  return (
    <div
      className={cx(
        "mt-6 flex items-center gap-3",
        align === "between" ? "justify-between" : "justify-end",
        className
      )}
    >
      {children}
    </div>
  );
}
