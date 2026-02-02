"use client";

import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/src/components/ui/classNames";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "accent"
  | "danger";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: ButtonStyleProps & { className?: string }) {
  const base =
    "inline-flex items-center justify-center rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 [&_svg]:fill-current [&_svg]:text-current";
  const sizes: Record<ButtonSize, string> = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };
  // Primary should always use on-primary text for contrast; avoid overriding via className.
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[color:var(--color-primary)] !text-[color:var(--color-on-primary)] hover:bg-[#002f60] hover:!text-[color:var(--color-on-primary)] disabled:!text-[color:rgba(255,255,255,0.7)]",
    secondary:
      "border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-primary)] hover:bg-[color:var(--bg-muted)]",
    outline:
      "border border-[color:var(--color-primary)] text-[color:var(--color-primary)] hover:bg-[color:var(--bg-muted)]",
    ghost:
      "text-[color:var(--color-primary)] hover:bg-[color:var(--bg-muted)]",
    accent:
      "bg-[color:var(--color-accent)] text-[color:var(--color-on-surface)] hover:bg-[#05b692]",
    danger:
      "bg-[#C95757] !text-[color:var(--color-on-primary)] hover:bg-[#b94747] hover:!text-[color:var(--color-on-primary)]",
  };

  return cx(base, sizes[size], variants[variant], fullWidth ? "w-full" : "", className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonStyleProps;

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={buttonClassName({ variant, size, fullWidth, className })}
    />
  );
}
