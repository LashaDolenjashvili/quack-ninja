export const typography = {
  headingLg: "text-lg font-semibold text-[color:var(--text-primary)]",
  headingMd: "text-base font-semibold text-[color:var(--text-primary)]",
  bodySm: "text-sm text-[color:var(--text-secondary)]",
  bodyXs: "text-xs text-[color:var(--text-secondary)]",
  label:
    "text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]",
} as const;

export const spacing = {
  stackSm: "mt-3",
  stackMd: "mt-4",
  stackLg: "mt-6",
  cardPadding: "p-6",
  cardPaddingLg: "p-8",
} as const;
