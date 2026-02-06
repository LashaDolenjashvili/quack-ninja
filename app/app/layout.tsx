import type { Metadata } from "next";
import { AuthGuard } from "@/src/components/auth/AuthGuard";
import { SidebarClient } from "@/src/components/SidebarClient";
import { ConsoleSessionProvider } from "@/src/components/ConsoleSessionProvider";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ConsoleSessionProvider>
        <div className="flex min-h-screen bg-[#F7FAFC]">
          <SidebarClient />
          <main className="flex-1">{children}</main>
        </div>
      </ConsoleSessionProvider>
    </AuthGuard>
  );
}
