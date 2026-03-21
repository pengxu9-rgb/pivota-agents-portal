import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PortalShell from "@/components/PortalShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PortalShell>{children}</PortalShell>
      </body>
    </html>
  );
}
