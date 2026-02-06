import type { MetadataRoute } from "next";

const baseUrl = "https://www.quackninja.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes = [
    "",
    "/pricing",
    "/docs",
    "/terms-and-conditions",
    "/privacy-policy",
    "/refund-policy",
  ];

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
  }));
}
