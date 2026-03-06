import type { Metadata } from "next";
import { DocsPage } from "@/src/components/docs/DocsPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Docs: Import Parquet",
  description:
    "Import Parquet files into QuackNinja and run DuckDB SQL locally in your browser.",
  path: "/docs/import/parquet",
});

export default function DocsImportParquetPage() {
  return <DocsPage slug="import-parquet" />;
}
