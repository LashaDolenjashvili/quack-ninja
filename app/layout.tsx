import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { NavigationLogger } from "@/src/components/NavigationLogger";
import { Suspense } from "react";
import { QueryProvider } from "@/src/components/QueryProvider";
import { Providers } from "./providers";
import { SITE_URL } from "@/lib/seo";
import "../src/styles/globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "QuackNinja",
    template: "%s | QuackNinja",
  },
  description:
    "Run SQL on CSV, Excel, and Parquet in your browser with DuckDB. Query files quickly and export clean results.",
  openGraph: {
    title: "QuackNinja",
    description:
      "Run SQL on CSV, Excel, and Parquet in your browser with DuckDB.",
    siteName: "QuackNinja",
    type: "website",
    images: ["/brand/quack-ninja.svg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/quack-ninja.svg"],
  },
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
