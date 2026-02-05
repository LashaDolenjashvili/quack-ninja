import type { ReactNode } from "react";

type AuthHeaderProps = {
  kicker: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
};

export function AuthHeader({ kicker, title, subtitle, badge }: AuthHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#09A483]">
        {kicker}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-[color:var(--text-primary)] md:text-3xl">
          {title}
        </h1>
        {badge ? badge : null}
      </div>
      {subtitle ? (
        <p className="text-sm text-[color:var(--text-secondary)]">{subtitle}</p>
      ) : null}
    </div>
  );
}
