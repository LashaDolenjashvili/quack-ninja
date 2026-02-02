"use client";

import { Button } from "@/src/components/ui/button";
import {
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@/src/components/ui/modal";
import { getPlanDisplay } from "@/src/lib/planDisplay";

type TrialTermsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function TrialTermsModal({ open, onClose }: TrialTermsModalProps) {
  const freePlan = getPlanDisplay("free");
  const proPlan = getPlanDisplay("pro");

  if (!open) {
    return null;
  }

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader
          title="7-day Pro trial"
          description="Clear, simple terms."
        />
        <div className="mt-4 space-y-4 text-sm text-[#0B1220]">
          <ul className="space-y-1 text-sm text-[#5B6B82]">
            <li>Starts when you create an account</li>
            <li>No credit card required</li>
            <li>Ends automatically—keep using Free or upgrade anytime</li>
          </ul>
          <div className="rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
              During trial
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#0B1220]">
              <li>Up to {proPlan.display.fileSize} per file</li>
              <li>Up to {proPlan.display.previewRows} preview rows</li>
              <li>Up to {proPlan.display.exportRows} exported rows</li>
              <li>Unlimited saved queries</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[#E6EEF7] bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
              After trial
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#0B1220]">
              <li>Up to {freePlan.display.fileSize} per file</li>
              <li>Up to {freePlan.display.previewRows} preview rows</li>
              <li>Up to {freePlan.display.exportRows} exported rows</li>
              <li>{freePlan.display.savedQueries} saved queries</li>
            </ul>
          </div>
          <p className="text-xs text-[#5B6B82]">
            Trial is available once per account. You can upgrade anytime to keep Pro.
          </p>
        </div>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
