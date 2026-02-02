"use client";

import { useRef, useState } from "react";
import { getLimits, type PlanTier } from "@/src/lib/plans";
import { can } from "@/src/billing/plan";

type FileUploaderProps = {
  onUpload: (file: File, handle?: FileSystemFileHandle | null) => Promise<void>;
  onPickFile?: () => Promise<{
    file: File;
    handle?: FileSystemFileHandle | null;
  } | null>;
  selectedFile?: File | null;
  plan: PlanTier;
  isUploading: boolean;
};

export function FileUploader({
  onUpload,
  onPickFile,
  selectedFile,
  plan,
  isUploading,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const limits = getLimits(plan);
  const maxSizeMB = Math.floor(limits.maxSingleFileBytes / (1024 * 1024));

  const handleFile = async (
    file: File,
    handle?: FileSystemFileHandle | null
  ) => {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv") {
      setError("Only CSV files are supported.");
      return;
    }
    const gate = can("attach_file", { plan, fileSize: file.size });
    if (gate !== true) {
      setError(`File exceeds ${maxSizeMB}MB limit.`);
      return;
    }
    await onUpload(file, handle);
  };

  const handlePick = async () => {
    if (onPickFile) {
      const picked = await onPickFile();
      if (picked?.file) {
        await handleFile(picked.file, picked.handle ?? null);
        return;
      }
    }
    inputRef.current?.click();
  };

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-sm text-[#5B6B82] ${
        isDragging
          ? "border-[#003C79] bg-[#EEF4FB]"
          : "border-[#D6E2F1] bg-[#F7FAFC]"
      } ${isUploading ? "opacity-60" : ""}`}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
          void handleFile(file);
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
    >
      <p className="text-sm font-semibold text-[#0B1220]">
        {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
      </p>
      <p className="mt-1 text-xs text-[#5B6B82]">
        {selectedFile
          ? `${Math.round(selectedFile.size / 1024)}KB`
          : `CSV files only (max ${maxSizeMB}MB)`}
      </p>
      <button
        type="button"
        onClick={handlePick}
        className="mt-2 rounded-lg border border-[#E6EEF7] bg-white px-3 py-1.5 text-xs font-semibold text-[#003C79]"
        disabled={isUploading}
      >
        {selectedFile ? "Change file" : "Choose file"}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".csv,text/csv"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
          event.target.value = "";
        }}
        disabled={isUploading}
      />
      {error ? (
        <p className="mt-2 text-xs font-semibold text-[#C95757]">{error}</p>
      ) : null}
    </div>
  );
}
