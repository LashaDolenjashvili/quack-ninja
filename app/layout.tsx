import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { NavigationLogger } from "@/src/components/NavigationLogger";
import { Suspense } from "react";
import { QueryProvider } from "@/src/components/QueryProvider";
import { Providers } from "./providers";
import "../src/styles/globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.quackninja.com"),
  title: {
    default: "QuackNinja",
    template: "%s — QuackNinja",
  },
  description:
    "Run SQL on CSV, Excel, and Parquet locally in your browser. Get answers fast and export clean results.",
  openGraph: {
    title: "QuackNinja",
    description:
      "Open exports in your browser, get answers fast, and share a clean CSV in minutes.",
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
