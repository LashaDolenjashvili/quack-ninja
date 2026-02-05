import type { HTMLAttributes } from "react";
import { cx } from "@/src/components/ui/classNames";

type DividerProps = HTMLAttributes<HTMLDivElement>;

export function Divider({ className, ...props }: DividerProps) {
  return <div {...props} className={cx("qn-divider", className)} />;
}
