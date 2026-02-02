"use client";

import { useState } from "react";

export function Callout({
  tone = "note",
  title,
  children,
}: {
  tone?: "note" | "tip" | "warning";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    note:
      "border-[color:var(--border)] bg-[color:var(--bg-muted)] text-[color:var(--text-primary)]",
    tip: "border-[#C2F3E9] bg-[#ECFBF7] text-[color:var(--text-primary)]",
    warning: "border-[#F7C56A] bg-[#FDF5E8] text-[#6B4B0A]",
  };
  const label = title ?? (tone === "tip" ? "Tip" : tone === "warning" ? "Warning" : "Note");
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em]">
        {label}
      </p>
      <div className="mt-2 space-y-2 text-sm text-[color:var(--text-secondary)]">
        {children}
      </div>
    </div>
  );
}

export function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-3 text-sm text-[color:var(--text-secondary)]">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#003C79] text-xs font-semibold text-white">
            {index + 1}
          </span>
          <div>{item}</div>
        </li>
      ))}
    </ol>
  );
}

export function CodeBlock({
  code,
  language = "sql",
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="relative overflow-hidden rounded-xl border border-[color:var(--border)] bg-[#0B1220]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/60">
        <span>{language}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/70"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-auto px-4 py-3 text-xs text-[#E6EEF7]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function InlineLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="font-semibold text-[#003C79] hover:text-[#002f60]">
      {children}
    </a>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
        {title}
      </h2>
      <div className="mt-3 space-y-4 text-sm text-[color:var(--text-secondary)]">
        {children}
      </div>
    </section>
  );
}
