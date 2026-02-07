"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

type ResultsTableProps = {
  columns: string[];
  rows: Record<string, unknown>[];
  maxHeight?: number;
  fill?: boolean;
};

function isLikelyDateTimeColumn(name: string) {
  return /(date|time|timestamp|created|updated|deleted|birthday|dob|start|end)/i.test(
    name
  );
}

function formatEpochIfNeeded(value: unknown, column: string) {
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  if (!isLikelyDateTimeColumn(column)) {
    return null;
  }
  let ms: number | null = null;
  if (value >= 1_000_000_000_000_000 && value <= 9_999_999_999_999_999) {
    ms = Math.floor(value / 1000);
  } else if (value >= 1_000_000_000_000 && value <= 9_999_999_999_999) {
    ms = Math.floor(value);
  } else if (value >= 1_000_000_000 && value <= 9_999_999_999) {
    ms = Math.floor(value * 1000);
  }
  if (!ms) {
    return null;
  }
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString();
}

function formatCell(value: unknown, column: string) {
  if (value === null || value === undefined) {
    return "";
  }
  const epochFormatted = formatEpochIfNeeded(value, column);
  if (epochFormatted) {
    return epochFormatted;
  }
  return String(value);
}

export function ResultsTable({ columns, rows, maxHeight, fill }: ResultsTableProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const visibleRowLimit = 10;
  const rowHeight = 36;
  const headerHeight = 40;
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 8,
  });

  const gridTemplate = `repeat(${Math.max(columns.length, 1)}, minmax(160px, 1fr))`;
  const minWidth = Math.max(columns.length * 160, 640);
  const defaultMaxHeight =
    rows.length > visibleRowLimit
      ? headerHeight + rowHeight * visibleRowLimit
      : undefined;
  const appliedMaxHeight = maxHeight ?? defaultMaxHeight;

  const containerStyle = {
    ...(appliedMaxHeight ? { maxHeight: appliedMaxHeight } : {}),
    ...(fill ? { height: "100%", maxHeight: "100%" } : {}),
  };

  return (
    <div
      ref={parentRef}
      className="w-full overflow-auto rounded-xl border border-[#E6EEF7] text-xs"
      style={containerStyle}
    >
      <div style={{ minWidth }}>
        <div
          className="sticky top-0 z-10 grid border-b border-[#E6EEF7] bg-white"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {columns.map((column) => (
            <div
              key={column}
              className="px-3 py-2 text-left font-semibold text-[#0B1220]"
            >
              {column}
            </div>
          ))}
        </div>
        <div
          className="relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index] ?? {};
            return (
              <div
                key={virtualRow.key}
                className={`absolute left-0 right-0 grid border-b border-[#E6EEF7] ${
                  virtualRow.index % 2 === 0 ? "bg-[#F7FAFC]" : "bg-white"
                }`}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  gridTemplateColumns: gridTemplate,
                }}
              >
                {columns.map((column) => (
                  (() => {
                    const displayValue = formatCell(row[column], column);
                    return (
                      <div
                        key={`${virtualRow.key}-${column}`}
                        className="px-3 py-2 text-[#0B1220]"
                      >
                        <span className="block truncate" title={displayValue}>
                          {displayValue}
                        </span>
                      </div>
                    );
                  })()
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
