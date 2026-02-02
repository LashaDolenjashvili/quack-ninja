"use client";

import { useMemo, useState } from "react";

type CapacityResult = {
  cores: number;
  memoryGb: number | null;
  rating: "Low" | "Medium" | "High" | "Very High";
  recommendedMaxFileBytes: number;
  recommendedPreviewRows: number;
  recommendedRenderRows: number;
};

const SESSION_BUDGET_BYTES = 2 * 1024 * 1024 * 1024;
const MB = 1024 * 1024;

function estimateCapacity(): CapacityResult {
  const cores = navigator.hardwareConcurrency ?? 4;
  const memoryGb =
    typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory ===
    "number"
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null
      : null;

  const score = cores + (memoryGb ?? 4);
  const defaultsByRating = {
    Low: { maxFileMb: 100, previewRows: 2000, renderRows: 2000 },
    Medium: { maxFileMb: 250, previewRows: 5000, renderRows: 5000 },
    High: { maxFileMb: 500, previewRows: 10000, renderRows: 10000 },
    "Very High": { maxFileMb: 1000, previewRows: 10000, renderRows: 10000 },
  } as const;

  if (score <= 6) {
    const recommended = defaultsByRating.Low;
    return {
      cores,
      memoryGb,
      rating: "Low",
      recommendedMaxFileBytes: Math.min(
        recommended.maxFileMb * MB,
        SESSION_BUDGET_BYTES
      ),
      recommendedPreviewRows: recommended.previewRows,
      recommendedRenderRows: recommended.renderRows,
    };
  }
  if (score <= 12) {
    const recommended = defaultsByRating.Medium;
    return {
      cores,
      memoryGb,
      rating: "Medium",
      recommendedMaxFileBytes: Math.min(
        recommended.maxFileMb * MB,
        SESSION_BUDGET_BYTES
      ),
      recommendedPreviewRows: recommended.previewRows,
      recommendedRenderRows: recommended.renderRows,
    };
  }
  if (score <= 20) {
    const recommended = defaultsByRating.High;
    return {
      cores,
      memoryGb,
      rating: "High",
      recommendedMaxFileBytes: Math.min(
        recommended.maxFileMb * MB,
        SESSION_BUDGET_BYTES
      ),
      recommendedPreviewRows: recommended.previewRows,
      recommendedRenderRows: recommended.renderRows,
    };
  }
  const recommended = defaultsByRating["Very High"];
  return {
    cores,
    memoryGb,
    rating: "Very High",
    recommendedMaxFileBytes: Math.min(
      recommended.maxFileMb * MB,
      SESSION_BUDGET_BYTES
    ),
    recommendedPreviewRows: recommended.previewRows,
    recommendedRenderRows: recommended.renderRows,
  };
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  }
  return `${Math.round(bytes / 1024)}KB`;
}

export function DeviceCapacityWidget() {
  const initial = useMemo(() => estimateCapacity(), []);
  const [result, setResult] = useState<CapacityResult>(initial);
  const [lastRun, setLastRun] = useState<number | null>(null);

  const handleRun = () => {
    setResult(estimateCapacity());
    setLastRun(Date.now());
  };

  return (
    <section className="mt-6 rounded-2xl border border-[#E6EEF7] bg-white p-6 shadow-[0_18px_48px_rgba(11,18,32,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#0B1220]">
            Device check
          </h2>
          <p className="mt-1 text-sm text-[#5B6B82]">
            This is a quick estimate. Your plan limits still apply.
          </p>
        </div>
        <button
          className="rounded-lg border border-[#E6EEF7] bg-white px-3 py-2 text-sm font-semibold text-[#003C79]"
          onClick={handleRun}
        >
          Run check
        </button>
      </div>
      <div className="mt-4 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3 text-sm text-[#5B6B82]">
        CPU: {result.cores} cores • Memory estimate:{" "}
        {result.memoryGb ? `${result.memoryGb}GB` : "Unknown"} • Rating:{" "}
        {result.rating}
      </div>
      <div className="mt-3 grid gap-2 text-sm text-[#5B6B82]">
        <p>
          Session file budget: {formatBytes(SESSION_BUDGET_BYTES)} total
          attached files.
        </p>
        <p>
          Recommended max single file size:{" "}
          {formatBytes(result.recommendedMaxFileBytes)}.
        </p>
        <p>
          Recommended preview size:{" "}
          {result.recommendedPreviewRows.toLocaleString()} rows.
        </p>
      </div>
      {lastRun ? (
        <p className="mt-2 text-xs text-[#9AA9BE]">
          Last run: {new Date(lastRun).toLocaleTimeString()}
        </p>
      ) : null}
    </section>
  );
}
