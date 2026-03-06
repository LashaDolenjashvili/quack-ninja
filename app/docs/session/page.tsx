import type { Metadata } from "next";
import { DocsPage } from "@/src/components/docs/DocsPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Docs: Session Behavior",
  description:
    "Understand session behavior, table persistence, and workspace handling in QuackNinja.",
  path: "/docs/session",
});

export default function DocsSessionPage() {
  return <DocsPage slug="session" />;
}
