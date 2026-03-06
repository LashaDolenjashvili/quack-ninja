import type { Metadata } from "next";
import { DocsPage } from "@/src/components/docs/DocsPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Docs",
  description:
    "Documentation for QuackNinja: import files, run DuckDB SQL locally, and export results.",
  path: "/docs",
});

export default function DocsOverviewPage() {
  return <DocsPage slug="overview" />;
}
