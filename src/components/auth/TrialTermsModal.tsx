"use client";

import { ModalContent, ModalHeader, ModalOverlay } from "@/src/components/ui/modal";
import { Button } from "@/src/components/ui/button";

type TrialTermsModalProps = {
  open: boolean;
  onClose: () => void;
  trialDays: number;
  proSummary: string[];
  freeSummary: string[];
};

export function TrialTermsModal({
  open,
  onClose,
  trialDays,
  proSummary,
  freeSummary,
}: TrialTermsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader
          title={`${trialDays}-day Pro trial`}
          description="Starts when you create an account."
        />
        <div className="mt-4 space-y-4 text-sm text-[#0B1220]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
              What’s included
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#4A5A72]">
              {proSummary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
              After the trial
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#4A5A72]">
              {freeSummary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-[#5B6B82]">
            No payment info required to start. Upgrade anytime to keep Pro.
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="primary" onClick={onClose}>
            Got it
          </Button>
        </div>
      </ModalContent>
    </ModalOverlay>
  );
}
