import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const indexableRoutes = [
  "/",
  "/pricing",
  "/docs",
  "/docs/quickstart",
  "/docs/import/csv",
  "/docs/import/excel",
  "/docs/import/parquet",
  "/docs/export",
  "/docs/session",
  "/docs/troubleshooting",
  "/terms-and-conditions",
  "/privacy-policy",
  "/refund-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return indexableRoutes.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
  }));
}
