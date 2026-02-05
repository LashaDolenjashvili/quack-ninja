"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Banner } from "@/src/components/ui/banner";

type ConfirmEmailNoticeProps = {
  notice?: string;
  email?: string;
};

export function ConfirmEmailNotice({ notice, email }: ConfirmEmailNoticeProps) {
  const router = useRouter();
  const [resolvedNotice, setResolvedNotice] = useState(notice);
  const [resolvedEmail, setResolvedEmail] = useState(email);

  useEffect(() => {
    if (resolvedNotice === "confirm_email") {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const noticeParam = params.get("notice") ?? undefined;
    const emailParam = params.get("email") ?? undefined;
    setResolvedNotice(noticeParam);
    setResolvedEmail(emailParam ?? resolvedEmail);
  }, [resolvedNotice, resolvedEmail]);

  if (resolvedNotice !== "confirm_email") {
    return null;
  }

  const message = resolvedEmail
    ? `We sent a confirmation link to ${resolvedEmail}. Open it to activate your account, then come back to sign in.`
    : "We sent a confirmation link to your inbox. Open it to activate your account, then come back to sign in.";

  return (
    <Banner tone="info">
      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-[color:var(--text-primary)]">
          Confirm your email
        </div>
        <p className="text-sm text-[color:var(--text-primary)]">
          {message}{" "}
          <span className="text-[color:var(--text-secondary)]">
            Check spam/promotions if you don't see it.
          </span>
        </p>
        <div>
          <button
            type="button"
            onClick={() => router.replace("/auth/sign-in")}
            className="text-sm font-semibold text-[color:var(--color-primary)] hover:text-[#002f60]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </Banner>
  );
}
