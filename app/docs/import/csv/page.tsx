import type { Metadata } from "next";
import { DocsPage } from "@/src/components/docs/DocsPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Docs: Import CSV",
  description:
    "Import CSV files into QuackNinja and query them with DuckDB SQL in your browser.",
  path: "/docs/import/csv",
});

export default function DocsCsvPage() {
  return <DocsPage slug="import-csv" />;
}
