import type { Metadata } from "next";
import { DocsPage } from "@/src/components/docs/DocsPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Docs: Export Results",
  description:
    "Export SQL query results from QuackNinja as clean CSV files for stakeholders.",
  path: "/docs/export",
});

export default function DocsExportPage() {
  return <DocsPage slug="export" />;
}
