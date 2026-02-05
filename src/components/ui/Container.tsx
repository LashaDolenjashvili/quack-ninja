import type { HTMLAttributes } from "react";
import { cx } from "@/src/components/ui/classNames";

type ContainerProps = HTMLAttributes<HTMLDivElement>;

export function Container({ className, ...props }: ContainerProps) {
  return <div {...props} className={cx("qn-container", className)} />;
}
