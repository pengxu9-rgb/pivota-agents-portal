import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Pivota – Unified Agent Payment Network",
  description: "Connect AI agents to merchants through unified payment infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="w-full border-b bg-white/80 backdrop-blur px-4 py-3 flex items-center justify-between">
          <a href="/" className="font-semibold">Pivota Agent Portal</a>
          <nav className="space-x-4">
            <a href="/dashboard" className="text-sm text-gray-700 hover:text-black">Dashboard</a>
            <a href="/integration" className="text-sm text-gray-700 hover:text-black">Integration</a>
            <a href="/developers/docs" className="text-sm text-blue-600 hover:underline">Developers Docs</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
