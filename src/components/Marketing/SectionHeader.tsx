import { cx } from "@/src/components/ui/classNames";

type SectionHeaderProps = {
  kicker: string;
  title: string;
  subtitle?: string;
  className?: string;
};

export function SectionHeader({
  kicker,
  title,
  subtitle,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cx("flex flex-col gap-3", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#09A483]">
        {kicker}
      </p>
      <h2 className="qn-heading">{title}</h2>
      {subtitle ? (
        <p className="qn-subheading">{subtitle}</p>
      ) : null}
    </div>
  );
}
