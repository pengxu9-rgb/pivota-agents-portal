import type { Metadata } from "next";
import PortalShell from "@/components/PortalShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pivota Developer Portal",
  description: "Production developer console for API keys, usage, orders, webhooks, and integration docs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PortalShell>{children}</PortalShell>
      </body>
    </html>
  );
}
