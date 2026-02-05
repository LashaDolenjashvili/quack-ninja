"use client";

import { Button } from "@/src/components/ui/button";
import {
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@/src/components/ui/modal";

type UpgradeModalProps = {
  open: boolean;
  title: string;
  description: string;
  bullets?: string[];
  bulletsLabel?: string;
  onClose: () => void;
  showUpgrade?: boolean;
  upgradeLabel?: string;
  upgradeHref?: string;
  isAuthenticated?: boolean;
};

export function UpgradeModal({
  open,
  title,
  description,
  bullets,
  bulletsLabel,
  onClose,
  showUpgrade = true,
  upgradeLabel = "Upgrade",
  upgradeHref,
  isAuthenticated = true,
}: UpgradeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader title={title} description={description} />
        {bullets?.length ? (
          <div className="mt-4 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3 text-sm text-[#5B6B82]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B6B82]">
              {bulletsLabel ?? (showUpgrade ? "Why upgrade" : "Suggestions")}
            </p>
            <ul className="mt-2 space-y-2">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#003C79]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {showUpgrade ? (
            <Button
              type="button"
              disabled
              className="cursor-not-allowed opacity-80"
            >
              Pro — coming soon
            </Button>
          ) : null}
        </ModalFooter>
        {showUpgrade ? (
          <p className="mt-3 text-xs text-[#9AA9BE]">
            Billing is being enabled. You can use QuackNinja free in the meantime.
          </p>
        ) : null}
      </ModalContent>
    </ModalOverlay>
  );
}
