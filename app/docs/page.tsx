import type { Metadata } from "next";
import { DocsPage } from "@/src/components/docs/DocsPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "QuackNinja Docs",
  description:
    "QuackNinja docs for importing files, running DuckDB SQL locally, and exporting results.",
  path: "/docs",
  keywords: [
    "QuackNinja docs",
    "QuackNinja documentation",
    "DuckDB browser SQL docs",
  ],
});

export default function DocsOverviewPage() {
  return <DocsPage slug="overview" />;
}
