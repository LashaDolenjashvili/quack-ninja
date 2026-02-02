"use client";

import { useEffect, useState } from "react";
import { Banner } from "@/src/components/ui/banner";
import { Button } from "@/src/components/ui/button";
import {
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@/src/components/ui/modal";

type ExportModalProps = {
  open: boolean;
  onClose: () => void;
  onExport: (options: {
    format: "csv";
    splitEnabled: boolean;
    rowsPerFile: number;
  }) => void;
  splitAvailable: boolean;
  exportLabel: string;
  exportCapLabel: string;
  capped: boolean;
  rowsToExport: number;
  splitRowsToExport?: number;
  blockedReason?: string | null;
  splitBlockedReason?: string | null;
  exportDisabled?: boolean;
};

export function ExportModal({
  open,
  onClose,
  onExport,
  splitAvailable,
  exportLabel,
  exportCapLabel,
  capped,
  rowsToExport,
  splitRowsToExport,
  blockedReason = null,
  splitBlockedReason = null,
  exportDisabled = false,
}: ExportModalProps) {
  const [format, setFormat] = useState<"csv">("csv");
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [rowsPerFile, setRowsPerFile] = useState(50000);
  const activeBlockedReason = splitEnabled ? splitBlockedReason : blockedReason;
  const effectiveDisabled = exportDisabled || Boolean(activeBlockedReason);
  const largeExportThreshold = 1_000_000;
  const totalRows = splitEnabled ? splitRowsToExport ?? rowsToExport : rowsToExport;
  const showLargeWarning = totalRows >= largeExportThreshold;

  useEffect(() => {
    if (!open) {
      setSplitEnabled(false);
      setFormat("csv");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader
          title="Export results"
          description="Exports results only (no full-table export)."
        />

        <div className="mt-4 space-y-4 text-sm text-[#0B1220]">
          <Banner tone="info" className="text-sm text-[#5B6B82]">
            Rows to export:{" "}
            <span className="font-semibold text-[#0B1220]">{exportLabel}</span>
            {capped ? (
              <span className="ml-2 text-xs text-[#C95757]">
                Plan export cap: {exportCapLabel} rows.
              </span>
            ) : null}
          </Banner>
          {activeBlockedReason ? (
            <Banner tone="warning">{activeBlockedReason}</Banner>
          ) : null}
          {showLargeWarning ? (
            <Banner tone="warning">
              Large exports may be slow in your browser. Consider adding LIMIT
              or exporting in smaller chunks.
            </Banner>
          ) : null}
          <Banner tone="info" className="text-sm">
            <span className="font-semibold text-[#0B1220]">Format</span>
            <span className="ml-2 text-[#5B6B82]">CSV</span>
          </Banner>

          <label className="flex items-center justify-between rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-sm">
            <span className="font-semibold text-[#0B1220]">
              Split export (multiple files)
            </span>
            <input
              type="checkbox"
              checked={splitEnabled}
              onChange={(event) => setSplitEnabled(event.target.checked)}
              disabled={!splitAvailable}
            />
          </label>
          {!splitAvailable ? (
            <p className="text-xs text-[#5B6B82]">
              Split exports are available on Pro.
            </p>
          ) : null}

          {splitEnabled ? (
            <label className="flex flex-col gap-2 font-semibold">
              Rows per file
              <input
                type="number"
                min={1000}
                value={rowsPerFile}
                onChange={(event) => setRowsPerFile(Number(event.target.value))}
                className="rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-sm"
              />
            </label>
          ) : null}
          {splitEnabled ? (
            <p className="text-xs text-[#5B6B82]">
              Total rows:{" "}
              {(splitRowsToExport ?? rowsToExport).toLocaleString()}
            </p>
          ) : null}
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() =>
              onExport({
                format,
                splitEnabled,
                rowsPerFile,
              })
            }
            disabled={effectiveDisabled}
            className="disabled:opacity-50"
          >
            Export
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
