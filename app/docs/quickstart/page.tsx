import type { Metadata } from "next";
import { DocsPage } from "@/src/components/docs/DocsPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Docs: Quickstart",
  description:
    "Quickstart guide for QuackNinja: import a file, run your first SQL query, and export results.",
  path: "/docs/quickstart",
});

export default function DocsQuickstartPage() {
  return <DocsPage slug="quickstart" />;
}
