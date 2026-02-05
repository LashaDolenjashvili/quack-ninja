import type { HTMLAttributes } from "react";
import { cx } from "@/src/components/ui/classNames";

type FeatureListProps = HTMLAttributes<HTMLUListElement> & {
  items: string[];
  tone?: "light" | "dark";
};

const toneClasses: Record<NonNullable<FeatureListProps["tone"]>, string> = {
  light: "text-[color:var(--text-secondary)]",
  dark: "text-white/90",
};

export function FeatureList({
  items,
  tone = "light",
  className,
  ...props
}: FeatureListProps) {
  return (
    <ul
      {...props}
      className={cx("space-y-3 text-sm leading-relaxed", toneClasses[tone], className)}
    >
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#09CEA4]" />
          <span className="break-words leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
