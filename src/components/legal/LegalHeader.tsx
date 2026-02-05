type LegalHeaderProps = {
  kicker: string;
  title: string;
  updatedAt: string;
};

export function LegalHeader({ kicker, title, updatedAt }: LegalHeaderProps) {
  return (
    <header className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#09A483]">
        {kicker}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text-primary)] md:text-4xl">
        {title}
      </h1>
      <p className="text-sm text-[color:var(--text-secondary)]">
        Last updated: {updatedAt}
      </p>
    </header>
  );
}
