import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { NavigationLogger } from "@/src/components/NavigationLogger";
import { Suspense } from "react";
import { QueryProvider } from "@/src/components/QueryProvider";
import { Providers } from "./providers";
import { GOOGLE_SITE_VERIFICATION, SITE_URL } from "@/lib/seo";
import "../src/styles/globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "QuackNinja",
  title: {
    default: "QuackNinja",
    template: "%s | QuackNinja",
  },
  description:
    "QuackNinja lets you run SQL on CSV, Excel, and Parquet in your browser with DuckDB. Query files quickly and export clean results.",
  keywords: [
    "QuackNinja",
    "SQL on CSV",
    "SQL on Excel",
    "SQL on Parquet",
    "DuckDB browser SQL",
    "query CSV locally",
  ],
  openGraph: {
    title: "QuackNinja",
    description:
      "QuackNinja helps you run SQL on CSV, Excel, and Parquet locally in your browser with DuckDB.",
    siteName: "QuackNinja",
    type: "website",
    images: ["/brand/quack-ninja.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuackNinja",
    description:
      "Run SQL on CSV, Excel, and Parquet locally in your browser with QuackNinja.",
    images: ["/brand/quack-ninja.svg"],
  },
  verification: GOOGLE_SITE_VERIFICATION
    ? {
        google: GOOGLE_SITE_VERIFICATION,
      }
    : undefined,
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${quicksand.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <Providers>
            <Suspense fallback={null}>
              <NavigationLogger />
            </Suspense>
            {children}
          </Providers>
        </QueryProvider>
      </body>
    </html>
  );
}
