import type { Metadata } from "next";
import { DocsPage } from "@/src/components/docs/DocsPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Docs: Troubleshooting",
  description:
    "Troubleshooting guide for QuackNinja covering imports, SQL results, and common runtime issues.",
  path: "/docs/troubleshooting",
});

export default function DocsTroubleshootingPage() {
  return <DocsPage slug="troubleshooting" />;
}
