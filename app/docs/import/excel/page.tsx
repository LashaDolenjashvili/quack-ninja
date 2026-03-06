import type { Metadata } from "next";
import { DocsPage } from "@/src/components/docs/DocsPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Docs: Import Excel",
  description:
    "Import Excel (.xlsx) files into QuackNinja, choose sheets, and query with SQL in-browser.",
  path: "/docs/import/excel",
});

export default function DocsExcelPage() {
  return <DocsPage slug="import-excel" />;
}
