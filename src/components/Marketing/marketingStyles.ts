export const marketingStyles = {
  section: "py-20",
  sectionInner: "mx-auto flex w-full max-w-6xl flex-col gap-10 px-6",
  eyebrow:
    "text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--text-secondary)]",
  heading:
    "text-3xl font-semibold leading-tight text-[color:var(--text-primary)] sm:text-4xl",
  subheading:
    "max-w-2xl text-base leading-relaxed text-[color:var(--text-secondary)]",
  card:
    "rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 shadow-[0_12px_32px_rgba(11,18,32,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(11,18,32,0.12)]",
  cardTitle: "text-lg font-semibold text-[color:var(--text-primary)]",
  cardBody:
    "mt-3 text-sm leading-relaxed text-[color:var(--text-secondary)]",
} as const;
