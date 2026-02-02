"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import {
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@/src/components/ui/modal";
import { goToUpgrade } from "@/src/lib/upgrade";

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
  const router = useRouter();
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
              onClick={() => {
                onClose();
                if (upgradeHref) {
                  router.push(upgradeHref);
                  return;
                }
                goToUpgrade(router, Boolean(isAuthenticated));
              }}
            >
              {upgradeLabel}
            </Button>
          ) : null}
        </ModalFooter>
        {showUpgrade ? (
          <p className="mt-3 text-xs text-[#9AA9BE]">
            Payments are coming soon.
          </p>
        ) : null}
      </ModalContent>
    </ModalOverlay>
  );
}
