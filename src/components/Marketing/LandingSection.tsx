import type { ReactNode } from "react";
import { cx } from "@/src/components/ui/classNames";
import { Section } from "@/src/components/ui/Section";
import { Container } from "@/src/components/ui/Container";

type LandingSectionProps = {
  id?: string;
  variant?: "surface" | "alt";
  className?: string;
  innerClassName?: string;
  children: ReactNode;
};

export function LandingSection({
  id,
  variant = "surface",
  className,
  innerClassName,
  children,
}: LandingSectionProps) {
  const sectionVariant = variant === "alt" ? "alt" : "light";
  return (
    <Section id={id} variant={sectionVariant} className={className}>
      <Container className={cx("flex w-full", innerClassName)}>
        {children}
      </Container>
    </Section>
  );
}
