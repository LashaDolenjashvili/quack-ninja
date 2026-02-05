"use client";

type WorkspaceTopBarProps = {
  title: string;
  onOpenSchema?: () => void;
  trialLabel?: string | null;
  trialEndsAtLabel?: string | null;
};

export function WorkspaceTopBar({
  title,
  onOpenSchema,
  trialLabel = null,
  trialEndsAtLabel = null,
}: WorkspaceTopBarProps) {
  return (
    <div className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-[color:var(--bg-surface)]">
      <div className="flex w-full flex-wrap items-center gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          {onOpenSchema ? (
            <button
              type="button"
              onClick={onOpenSchema}
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-2.5 py-2 text-xs font-semibold text-[color:var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)] md:hidden"
            >
              Tables
            </button>
          ) : null}
          <h1 className="text-lg font-semibold text-[color:var(--text-primary)]">
            {title}
          </h1>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-secondary)]">
          {trialLabel ? (
            <span
              className="inline-flex items-center gap-2 rounded-full border border-[#BFECE1] bg-[#EAFBF6] px-2 py-0.5 font-semibold text-[#0B6D58]"
              title={
                trialEndsAtLabel ? `Pro trial ends ${trialEndsAtLabel}` : "Pro trial"
              }
            >
              Pro trial • {trialLabel} left
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
