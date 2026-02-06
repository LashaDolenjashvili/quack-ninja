import type { Metadata } from "next";
import { DocsPage } from "@/src/components/docs/DocsPage";

export const metadata: Metadata = {
  title: "Docs • QuackNinja",
  description:
    "Documentation for QuackNinja: import files, run DuckDB SQL locally, and export results.",
  alternates: {
    canonical: "https://www.quackninja.com/docs",
  },
};

export default function DocsOverviewPage() {
  return <DocsPage slug="overview" />;
}
