type LegalTOCItem = {
  id: string;
  label: string;
};

type LegalTOCProps = {
  items: LegalTOCItem[];
};

export function LegalTOC({ items }: LegalTOCProps) {
  if (items.length < 4) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-muted)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">
        On this page
      </p>
      <ul className="mt-3 space-y-2 text-sm text-[color:var(--text-secondary)]">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="rounded-md px-2 py-1 transition hover:bg-white hover:text-[color:var(--color-primary)]"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
