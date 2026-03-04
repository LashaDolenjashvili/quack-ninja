"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { BILLING_CATALOG, type PaidPlanCode } from "@/src/billing/catalog";

type CheckoutOptionsModalProps = {
  open: boolean;
  planCode: PaidPlanCode;
  trialEndsAt: string | null;
  trialCountdown: string | null;
  working: boolean;
  onClose: () => void;
  onConfirm: (options: { autoRenew: boolean }) => void;
};

function formatTrialEnd(endsAt: string | null) {
  if (!endsAt) {
    return null;
  }
  return new Date(endsAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function CheckoutOptionsModal({
  open,
  planCode,
  trialEndsAt,
  trialCountdown,
  working,
  onClose,
  onConfirm,
}: CheckoutOptionsModalProps) {
  const [autoRenew, setAutoRenew] = useState(false);

  useEffect(() => {
    if (open) {
      setAutoRenew(false);
    }
  }, [open, planCode]);

  if (!open) {
    return null;
  }

  const plan = BILLING_CATALOG[planCode];
  const formattedTrialEnd = formatTrialEnd(trialEndsAt);
  const trialActive = Boolean(trialEndsAt);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0B1220]/50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_24px_80px_rgba(2,6,23,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#09A483]">
              Checkout
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[#0B1220]">
              {plan.label}
            </h3>
            <p className="mt-1 text-sm text-[#5B6B82]">
              {plan.monthlyPriceLabel}. Auto-renew is off by default.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={working}
            className="rounded-lg border border-[#E6EEF7] px-3 py-1.5 text-xs font-semibold text-[#003C79] transition hover:bg-[#F7FAFC]"
          >
            Close
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-[#E6EEF7] bg-[#F7FAFC] px-4 py-3 text-sm text-[#5B6B82]">
          <p className="font-semibold text-[#0B1220]">Renewal preference</p>
          <label className="mt-3 flex items-start gap-3">
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={(event) => setAutoRenew(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#B9C6D8] text-[#003C79] focus:ring-[#09CEA4]"
            />
            <span>
              Renew automatically each month
              <span className="mt-1 block text-xs text-[#5B6B82]">
                If left off, this plan ends at the close of the current paid cycle
                and your account returns to Free until you renew again.
              </span>
            </span>
          </label>
        </div>

        {trialActive ? (
          <div className="mt-4 rounded-xl border border-[#BFECE1] bg-[#EAFBF6] px-4 py-3 text-sm text-[#0B6D58]">
            <p className="font-semibold text-[#0B6D58]">Free trial still active</p>
            <p className="mt-1">
              Your trial ends {formattedTrialEnd ?? "soon"}
              {trialCountdown ? ` (${trialCountdown} left)` : ""}.
            </p>
            <p className="mt-1 text-xs text-[#0B6D58]">
              If you continue now, your paid subscription starts immediately.
              Your trial banner will still remain visible until the trial ends.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-[#E6EEF7] bg-white px-4 py-3 text-sm text-[#5B6B82]">
            You will be sent to Paddle to complete this purchase securely.
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={working}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm({ autoRenew })}
            disabled={working}
          >
            {working ? "Preparing checkout..." : "Continue to checkout"}
          </Button>
        </div>
      </div>
    </div>
  );
}
