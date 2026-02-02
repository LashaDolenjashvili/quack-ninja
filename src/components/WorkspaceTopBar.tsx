"use client";

import type { ReactNode } from "react";

type WorkspaceTopBarProps = {
  planBadge?: ReactNode;
  title: string;
  tableCount: number;
  status: string;
  hasRun: boolean;
  lastRunLabel: string;
  showingLabel: string;
  modeLabel?: string | null;
  running?: boolean;
  onExport?: () => void;
  exportDisabled?: boolean;
  exporting?: boolean;
  onAttach?: () => void;
  attachLabel?: string;
  importDisabled?: boolean;
  onOpenSchema?: () => void;
  attachPrimary?: boolean;
  trialLabel?: string | null;
  trialEndsAtLabel?: string | null;
};

export function WorkspaceTopBar({
  planBadge,
  title,
  tableCount,
  status,
  hasRun,
  lastRunLabel,
  showingLabel,
  modeLabel = null,
  running = false,
  onExport,
  exportDisabled = false,
  exporting = false,
  onAttach,
  attachLabel = "Attach file",
  importDisabled = false,
  onOpenSchema,
  attachPrimary = false,
  trialLabel = null,
  trialEndsAtLabel = null,
}: WorkspaceTopBarProps) {
  const statusLabel = running ? "Running…" : status;
  const attachClasses = attachPrimary
    ? "rounded-lg bg-[#003C79] px-3 py-1.5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79] disabled:opacity-60"
    : "rounded-lg border border-[#E6EEF7] bg-white px-3 py-1.5 text-sm font-semibold text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79] disabled:opacity-50";
  return (
    <div className="sticky top-0 z-20 border-b border-[#E6EEF7] bg-white">
      <div className="flex flex-wrap items-center gap-4 px-8 py-4">
        <div className="flex items-center gap-3">
          {onOpenSchema ? (
            <button
              type="button"
              onClick={onOpenSchema}
              className="rounded-lg border border-[#E6EEF7] bg-white px-2.5 py-2 text-xs font-semibold text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79] md:hidden"
            >
              Tables
            </button>
          ) : null}
          <h1 className="text-lg font-semibold text-[#0B1220]">
            {title}
          </h1>
        </div>

        <div className="flex flex-1 flex-col items-start justify-center gap-1 text-xs text-[#5B6B82] md:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Tables: <span className="tabular-nums">{tableCount}</span>
            </span>
            <span className="text-[#E6EEF7]">•</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#E6EEF7] px-2 py-0.5 font-semibold text-[#003C79]">
              {running ? (
                <span className="h-2 w-2 animate-spin rounded-full border border-[#003C79]/40 border-t-[#003C79]" />
              ) : null}
              {statusLabel}
            </span>
            {trialLabel ? (
              <>
                <span className="text-[#E6EEF7]">•</span>
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-[#BFECE1] bg-[#EAFBF6] px-2 py-0.5 font-semibold text-[#0B6D58]"
                  title={
                    trialEndsAtLabel
                      ? `Pro trial ends ${trialEndsAtLabel}`
                      : "Pro trial"
                  }
                >
                  Pro trial • {trialLabel} left
                </span>
              </>
            ) : null}
            {hasRun ? (
              <>
                <span className="text-[#E6EEF7]">•</span>
                <span>
                  Last run: <span className="tabular-nums">{lastRunLabel}</span>
                </span>
                <span className="text-[#E6EEF7]">•</span>
                <span>Showing: <span className="tabular-nums">{showingLabel}</span></span>
                {modeLabel ? (
                  <>
                    <span className="text-[#E6EEF7]">•</span>
                    <span>Mode: {modeLabel}</span>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <span className="text-[#E6EEF7]">•</span>
                <span>Run SQL to see results.</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {planBadge ? <div className="mr-1">{planBadge}</div> : null}
          {onAttach ? (
            <button
              className={attachClasses}
              onClick={onAttach}
              disabled={importDisabled}
              aria-label={attachLabel}
              title={attachLabel}
            >
              {attachLabel}
            </button>
          ) : null}
          {/* Run button moved closer to SQL editor */}
          {onExport ? (
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-[#E6EEF7] bg-white px-3 py-1.5 text-sm font-semibold text-[#003C79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003C79] disabled:opacity-50"
              onClick={onExport}
              disabled={exportDisabled || exporting}
              aria-disabled={exportDisabled || exporting}
              title={
                exportDisabled
                  ? "Run or write SQL to export"
                  : "Export results"
              }
            >
              {exporting ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-[#003C79]/40 border-t-[#003C79]" />
              ) : null}
              {exporting ? "Exporting…" : "Export"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
