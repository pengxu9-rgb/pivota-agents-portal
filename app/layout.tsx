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
      <head>
        <link rel="stylesheet" href="/pivota-brand/pivota-brand.css" />
        <link rel="icon" type="image/svg+xml" href="/pivota-brand/svg/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/pivota-brand/icons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/pivota-brand/icons/favicon-16.png" />
        <link rel="apple-touch-icon" href="/pivota-brand/icons/apple-touch-icon.png" />
      </head>
      <body className="antialiased">
        <PortalShell>{children}</PortalShell>
      </body>
    </html>
  );
}
