import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ||
  "https://www.quackninja.com";

export const BRAND_PROFILE_URLS = (
  process.env.NEXT_PUBLIC_BRAND_PROFILE_URLS ?? ""
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined;

export function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type MetadataInput = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  keywords?: string[];
};

export function buildMetadata({
  title,
  description,
  path,
  ogImage = "/brand/quack-ninja.svg",
  keywords,
}: MetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "QuackNinja",
      type: "website",
      images: [absoluteUrl(ogImage)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(ogImage)],
    },
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "QuackNinja",
    alternateName: ["Quack Ninja"],
    description:
      "QuackNinja is a browser-based SQL workspace for querying CSV, Excel, and Parquet files locally with DuckDB.",
    url: SITE_URL,
    logo: absoluteUrl("/brand/quack-ninja.svg"),
    ...(BRAND_PROFILE_URLS.length > 0 ? { sameAs: BRAND_PROFILE_URLS } : {}),
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "QuackNinja",
    url: SITE_URL,
    description:
      "Run SQL on CSV, Excel, and Parquet in your browser with QuackNinja.",
  };
}

export function buildSoftwareApplicationJsonLd(params: {
  description: string;
  includeOffers?: boolean;
}) {
  const base = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "QuackNinja",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: params.description,
  } as Record<string, unknown>;

  if (params.includeOffers) {
    base.offers = {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    };
  }

  return base;
}

export function buildFaqJsonLd(
  items: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
